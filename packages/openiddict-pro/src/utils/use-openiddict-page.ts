import {
  EXTENSIONS_IDENTIFIER,
  useExtensibleForm,
  type ExtensibleForm,
} from '@lsw-abpvue/components';
import {
  ConfigStateService,
  inject,
  provideAbp,
  SessionStateService,
  useListService,
  usePermission,
  type PageQueryParams,
  type PagedResultDto,
  type ProviderInput,
  type RestConfig,
} from '@lsw-abpvue/core';
import {
  ConfirmationStatus,
  useConfirmation,
  useServerValidation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onScopeDispose, ref, shallowRef, watch, watchEffect } from 'vue';
import { openIddictProExtensionsResolver } from '../resolvers/extensions.resolver.js';

export function useOpenIddictContext(policy: string) {
  const config = inject(ConfigStateService);
  const session = inject(SessionStateService);
  const permission = usePermission();
  const context = computed(() =>
    JSON.stringify([
      config.snapshot().currentUser,
      config.snapshot().currentTenant.id,
      session.getTenant()?.id,
      config.snapshot().auth.grantedPolicies,
    ]),
  );
  const allowed = computed(
    () =>
      config.snapshot().currentUser.isAuthenticated &&
      (session.getTenant()?.id ?? null) === (config.snapshot().currentTenant.id ?? null) &&
      permission.isGranted(policy),
  );
  const busy = ref(false);
  const failed = ref(false);
  let operation = new AbortController();
  function cancel(): void {
    operation.abort();
    operation = new AbortController();
    busy.value = false;
    failed.value = false;
  }
  watch(context, cancel, { flush: 'sync' });
  onScopeDispose(() => operation.abort());

  async function run<T>(
    request: (signal: AbortSignal) => Promise<T>,
    apply: (value: T) => void,
  ): Promise<void> {
    if (!allowed.value || busy.value) return;
    const own = operation;
    busy.value = true;
    failed.value = false;
    try {
      const result = await request(own.signal);
      if (own.signal.aborted) return;
      apply(result);
    } catch {
      // HTTP handlers display the server error; retain the draft for an explicit retry.
      if (!own.signal.aborted) failed.value = true;
    } finally {
      if (own === operation) busy.value = false;
    }
  }
  return { permission, context, allowed, busy, failed, cancel, run };
}

interface PageOptions<R, Input> {
  key: string;
  policy: string;
  service: {
    getList(query: PageQueryParams, config?: RestConfig): Promise<PagedResultDto<R>>;
    get(id: string, config?: RestConfig): Promise<R>;
    create(input: Input, config?: RestConfig): Promise<R>;
    update(id: string, input: Input, config?: RestConfig): Promise<R>;
    delete(id: string, config?: RestConfig): Promise<void>;
  };
  name(record: R): string;
  deletionMessage: string;
  input(values: Record<string, unknown>, record?: R): Input;
  providers: ProviderInput[];
  load?: ((signal: AbortSignal) => Promise<void>) | undefined;
  initialize?: ((form: ExtensibleForm<R>, record?: R) => void) | undefined;
}

export function useOpenIddictPage<R extends { id?: string | undefined }, Input>(
  options: PageOptions<R, Input>,
) {
  const state = useOpenIddictContext(options.policy);
  const toaster = useToaster();
  const confirmation = useConfirmation();
  const list = useListService({ persistKey: options.key });
  const open = ref(false);
  const editing = shallowRef<R>();
  const form = shallowRef<ExtensibleForm<R>>();
  const loadingFailed = computed(() => open.value && !form.value && !state.busy.value);
  const injector = provideAbp([
    { provide: EXTENSIONS_IDENTIFIER, useValue: options.key },
    ...options.providers,
  ]);
  let lifetime = new AbortController();
  onScopeDispose(() => lifetime.abort());
  const source = list.hookToQuery(async (query, signal) => {
    if (!state.allowed.value) return { items: [], totalCount: 0 };
    const own = AbortSignal.any([signal, lifetime.signal]);
    const result = await options.service.getList(query, { signal: own });
    return own.aborted ? { items: [], totalCount: 0 } : result;
  });
  useServerValidation({ setServerErrors: errors => form.value?.form.setServerErrors(errors) });
  watchEffect(() => {
    const draft = form.value;
    if (!draft) return;
    const data = { record: editing.value ?? ({} as R), getInjected: injector.get.bind(injector) };
    for (const prop of draft.props) {
      const control = draft.form.get(prop.name);
      if (control) {
        control.disabled = prop.disabled(data);
        control.readonly = prop.readonly(data);
      }
    }
  });

  async function show(record?: R): Promise<void> {
    if (
      (record && !record.id) ||
      state.busy.value ||
      !state.permission.isGranted(`${options.policy}.${record ? 'Update' : 'Create'}`)
    )
      return;
    state.cancel();
    open.value = true;
    editing.value = record;
    form.value = undefined;
    await state.run(
      async signal => {
        const [fresh] = await Promise.all([
          record?.id ? options.service.get(record.id, { signal }) : undefined,
          options.load?.(signal),
        ]);
        return fresh;
      },
      fresh => {
        editing.value = fresh;
        form.value = injector.runInContext(() => useExtensibleForm<R>(fresh));
        options.initialize?.(form.value, fresh);
      },
    );
  }

  async function save(): Promise<void> {
    const current = editing.value;
    const draft = form.value;
    if (
      !open.value ||
      !draft ||
      (current && !current.id) ||
      !state.permission.isGranted(`${options.policy}.${current ? 'Update' : 'Create'}`) ||
      !draft.form.validate()
    )
      return;
    await state.run(
      signal => {
        draft.form.clearServerErrors();
        const input = options.input(draft.toRequestBody(), current);
        return current?.id
          ? options.service.update(current.id, input, { signal })
          : options.service.create(input, { signal });
      },
      () => {
        open.value = false;
        toaster.success('AbpUi::SavedSuccessfully');
        list.getWithoutPageReset();
      },
    );
  }

  async function remove(record: R): Promise<void> {
    if (!record.id || !state.permission.isGranted(`${options.policy}.Delete`)) return;
    const id = record.id;
    await state.run(
      async signal => {
        const answer = await confirmation.warn(
          options.deletionMessage,
          'AbpOpenIddict::AreYouSure',
          { messageLocalizationParams: [options.name(record)] },
        );
        if (answer !== ConfirmationStatus.confirm || signal.aborted) return false;
        await options.service.delete(id, { signal });
        return true;
      },
      deleted => {
        if (!deleted) return;
        toaster.success('AbpUi::DeletedSuccessfully');
        list.getWithoutPageReset();
      },
    );
  }

  watch(
    open,
    visible => {
      if (!visible) {
        state.cancel();
        form.value = undefined;
        editing.value = undefined;
      }
    },
    { flush: 'sync' },
  );
  watch(
    state.context,
    () => {
      open.value = false;
      lifetime.abort();
      lifetime = new AbortController();
      source.items.value = [];
      source.error.value = null;
      list.totalCount.value = 0;
      injector.runInContext(openIddictProExtensionsResolver);
      list.get();
    },
    { flush: 'sync' },
  );
  return { ...state, ...source, list, open, editing, form, loadingFailed, show, save, remove };
}
