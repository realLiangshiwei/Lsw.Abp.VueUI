import {
  EXTENSIONS_IDENTIFIER,
  useExtensibleForm,
  type ExtensibleForm,
} from '@lsw-abpvue/components';
import {
  ConfigStateService,
  inject,
  provideAbp,
  runInInjectionContext,
  usePermission,
  type ProviderInput,
  type RestConfig,
} from '@lsw-abpvue/core';
import { useServerValidation, useToaster } from '@lsw-abpvue/theme-shared';
import { computed, ref, shallowRef, watch } from 'vue';
import type {
  SaasTenantFormAsyncValidator,
  SaasTenantFormValidator,
} from '../tokens/pages.token.js';
import { collectSaasFormValues } from './form-values.js';
import { useSaasOperation } from './use-saas-operation.js';

interface EditorRecord {
  id?: string | undefined;
  concurrencyStamp?: string | undefined;
  extraProperties?: Record<string, unknown> | undefined;
}

export function useSaasEditor<R extends EditorRecord>(options: {
  identifier: string;
  policy: string;
  providers: ProviderInput[];
  load(record: R | undefined, signal: AbortSignal): Promise<R | undefined>;
  create(values: Record<string, unknown>, config: RestConfig): Promise<unknown>;
  update(id: string, values: Record<string, unknown>, config: RestConfig): Promise<unknown>;
  reload(): void;
  validators?: readonly SaasTenantFormValidator[] | undefined;
  asyncValidators?: readonly SaasTenantFormAsyncValidator[] | undefined;
}) {
  const config = inject(ConfigStateService);
  const permission = usePermission();
  const toaster = useToaster();
  const operation = useSaasOperation(options.policy);
  const injector = provideAbp([
    { provide: EXTENSIONS_IDENTIFIER, useValue: options.identifier },
    ...options.providers,
  ]);
  const ready = ref(false);
  const target = shallowRef<R>();
  const editor = {
    open: ref(false),
    busy: operation.busy,
    editing: shallowRef<R>(),
    form: shallowRef<ExtensibleForm<R>>(),
  };
  const mayEdit = computed(
    () =>
      operation.allowed.value &&
      permission.isGranted(`${options.policy}.${target.value ? 'Update' : 'Create'}`),
  );
  const canSave = computed(
    () => editor.open.value && ready.value && !operation.busy.value && mayEdit.value,
  );
  useServerValidation({
    setServerErrors: errors => editor.form.value?.form.setServerErrors(errors),
  });

  function reset() {
    operation.reset();
    ready.value = false;
    editor.form.value = undefined;
    editor.open.value = false;
  }
  async function show(record?: R) {
    if (
      operation.busy.value ||
      (record && !record.id) ||
      !permission.isGranted(`${options.policy}.${record ? 'Update' : 'Create'}`)
    )
      return;
    reset();
    target.value = record;
    editor.editing.value = record;
    editor.open.value = true;
    await operation.run(
      async signal => {
        const fresh = await options.load(record, signal);
        if (record && fresh?.id !== record.id) throw new SaasEditorStateError();
        return fresh;
      },
      fresh => {
        editor.editing.value = fresh;
        editor.form.value = runInInjectionContext(injector, () => useExtensibleForm<R>(fresh));
        ready.value = true;
      },
    );
  }
  async function save() {
    const form = editor.form.value;
    if (!form || !canSave.value || !form.form.validate()) return;
    await operation.run(
      async signal => {
        form.form.clearServerErrors();
        const errors = [
          ...(options.validators ?? []).flatMap(validate => validate(form.form) ?? []),
          ...(
            await Promise.all((options.asyncValidators ?? []).map(validate => validate(form.form)))
          ).flatMap(result => result ?? []),
        ];
        if (signal.aborted || !mayEdit.value) return false;
        if (errors.length) {
          form.form.setServerErrors(errors);
          return false;
        }
        const values = collectSaasFormValues(form, editor.editing.value, injector);
        const id = editor.editing.value?.id;
        if (id) await options.update(id, values, { signal });
        else await options.create(values, { signal });
        return true;
      },
      saved => {
        if (!saved) return;
        editor.open.value = false;
        toaster.success('AbpUi::SavedSuccessfully');
        options.reload();
      },
    );
  }
  watch(
    editor.open,
    open => {
      if (!open) reset();
    },
    { flush: 'sync' },
  );
  watch(operation.context, reset, { flush: 'sync' });
  watch(
    () => config.snapshot().auth.grantedPolicies,
    () => {
      if (!mayEdit.value) reset();
    },
    { flush: 'sync' },
  );
  return {
    editor,
    show,
    save,
    canSave,
    target,
    loading: computed(() => !ready.value && operation.busy.value),
    failed: computed(() => !ready.value && operation.failed.value),
  };
}

class SaasEditorStateError extends Error {
  constructor() {
    super('AbpUi::ErrorLoadingDatatable');
    this.name = 'SaasEditorStateError';
  }
}
