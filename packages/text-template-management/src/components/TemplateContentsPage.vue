<template>
  <AbpPage v-if="allowed" title="TextTemplateManagement::Contents">
    <div v-if="inline" class="abp-inline-content-description alert alert-info" role="note">
      <template v-for="(part, index) in inlineDescription" :key="index">
        <a v-if="part.href" :href="part.href" target="_blank" rel="noopener noreferrer">{{
          part.text
        }}</a>
        <template v-else>{{ part.text }}</template>
      </template>
    </div>
    <div v-if="definition?.isNotSandboxedEngine" class="alert alert-warning" role="alert">
      <strong>{{ $t('TextTemplateManagement::NonSandboxedTemplate') }}</strong>
      {{ $t('TextTemplateManagement::NonSandboxedTemplateWarning') }}
    </div>
    <div class="card">
      <div class="card-header">
        {{ $t('TextTemplateManagement::Name') }}: <strong>{{ templateName }}</strong>
      </div>
      <div class="card-body">
        <form id="template-content-form" @submit.prevent="write('save')">
          <div class="row g-3">
            <div v-if="!inline" class="col-12 col-md-6">
              <label class="form-label" for="base-culture">{{
                $t('TextTemplateManagement::BaseCultureName')
              }}</label>
              <AbpSelect
                id="base-culture"
                v-model="referenceCulture"
                :options="languageOptions"
                :disabled="busy"
              />
              <label class="form-label mt-3" for="reference-content">{{
                $t('TextTemplateManagement::BaseContent')
              }}</label>
              <textarea
                id="reference-content"
                class="abp-template-content form-control"
                rows="14"
                :value="referenceContent"
                readonly
                :aria-busy="referenceLoading"
              />
              <p v-if="referenceFailed" role="alert">
                {{ $t('AbpUi::ErrorLoadingDatatable') }}
                <AbpButton variant="secondary" @click="loadReference">{{
                  $t('AbpUi::Refresh')
                }}</AbpButton>
              </p>
            </div>
            <div :class="inline ? 'col-12' : 'col-12 col-md-6'">
              <template v-if="!inline">
                <label class="form-label" for="target-culture">{{
                  $t('TextTemplateManagement::TargetCultureName')
                }}</label>
                <AbpSelect
                  id="target-culture"
                  v-model="selectedCulture"
                  :options="languageOptions"
                  :disabled="busy"
                  class="mb-3"
                />
              </template>
              <AbpSpinner v-if="loading" />
              <p v-if="loadFailed" role="alert">
                {{ $t('AbpUi::ErrorLoadingDatatable') }}
                <AbpButton variant="secondary" @click="load">{{ $t('AbpUi::Refresh') }}</AbpButton>
              </p>
              <AbpFormField
                for="template-content"
                :label="$t('TextTemplateManagement::TemplateContent')"
                required
                :errors="fieldErrors"
              >
                <template #default="{ id, describedBy, invalid }">
                  <textarea
                    :id="id"
                    v-model="form.controls.content.value"
                    class="abp-template-content form-control"
                    rows="14"
                    :disabled="editingDisabled || busy"
                    :aria-describedby="describedBy"
                    :aria-invalid="invalid"
                    @blur="form.controls.content.markAsTouched()"
                  />
                </template>
              </AbpFormField>
              <p v-for="message in form.unmatchedServerErrors" :key="message" role="alert">
                {{ message }}
              </p>
            </div>
          </div>
          <div class="d-flex flex-column flex-md-row justify-content-between gap-2 mt-3">
            <RouterLink to="/text-template-management/text-templates" class="btn btn-secondary">{{
              $t('TextTemplateManagement::ReturnToTemplates')
            }}</RouterLink>
            <div class="d-flex flex-column flex-md-row gap-2">
              <AbpButton
                v-if="inline"
                variant="secondary"
                outline
                :disabled="busy || !definition"
                @click="customizePerCulture"
                >{{ $t('TextTemplateManagement::CustomizePerCulture') }}</AbpButton
              >
              <AbpButton
                variant="secondary"
                outline
                :disabled="editingDisabled || busy"
                @click="write('restore')"
                >{{ $t('TextTemplateManagement::RestoreToDefault') }}</AbpButton
              >
              <AbpButton type="submit" :loading="busy" :disabled="editingDisabled">{{
                $t('TextTemplateManagement::SaveContent')
              }}</AbpButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  </AbpPage>
</template>

<script setup lang="ts">
import { AbpPage } from '@lsw-abpvue/components';
import { inject, useLocalization } from '@lsw-abpvue/core';
import { TextTemplateManagementPolicyNames as Policy } from '@lsw-abpvue/text-template-management/config';
import {
  TemplateContentService,
  TemplateDefinitionService,
  type TemplateDefinitionDto,
} from '@lsw-abpvue/text-template-management/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpSelect,
  AbpSpinner,
  useAbpForm,
  useServerValidation,
  useToaster,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useTextTemplateManagement } from '../utils/use-text-template-management.js';

const props = defineProps<{ inline?: boolean | undefined }>();
const route = useRoute();
const router = useRouter();
const contents = inject(TemplateContentService);
const definitions = inject(TemplateDefinitionService);
const state = useTextTemplateManagement(Policy.EditContents);
const { allowed, context, config, permission } = state;
const localization = useLocalization();
const toaster = useToaster();
const messagesOf = useValidationMessages();
const templateName = computed(() =>
  typeof route.params.name === 'string' ? route.params.name : '',
);
const languages = computed(() => config.snapshot().localization.languages);
const languageOptions = computed(() =>
  languages.value
    .filter(language => language.cultureName)
    .map(language => ({
      label: language.displayName ?? language.cultureName ?? '',
      value: language.cultureName ?? '',
    })),
);
const selectedCulture = ref<string | null>(null);
const referenceCulture = ref<string | null>(null);
const definition = shallowRef<TemplateDefinitionDto>();
const loading = ref(false);
const loadFailed = ref(false);
const referenceContent = ref('');
const referenceLoading = ref(false);
const referenceFailed = ref(false);
const busy = ref(false);
const form = useAbpForm({ content: { value: '', validators: [Validators.required()] } });
useServerValidation(form);
const fieldErrors = computed(() =>
  form.controls.content.touched ? messagesOf(form.controls.content.errors) : [],
);
const editingDisabled = computed(
  () =>
    !allowed.value ||
    loading.value ||
    !definition.value ||
    (definition.value.isNotSandboxedEngine &&
      !permission.isGranted(Policy.EditNonSandboxedContents)),
);
let targetRequest = new AbortController();
let referenceRequest = new AbortController();
let operation: AbortController | undefined;

const inlineDescription = computed(() =>
  localization
    .t('TextTemplateManagement::InlineContentDescription')
    .split(/(<a\s[^>]*>[^<]*<\/a>)/gi)
    .map(text => {
      const link = /<a\s[^>]*href="(https:\/\/[^"]+)"[^>]*>([^<]*)<\/a>/i.exec(text);
      return {
        text: link?.[2] ?? text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''),
        href: link?.[1],
      };
    }),
);

async function load(): Promise<void> {
  targetRequest.abort();
  const own = new AbortController();
  targetRequest = own;
  loading.value = false;
  definition.value = undefined;
  loadFailed.value = false;
  if (!allowed.value || !templateName.value || (!props.inline && !selectedCulture.value)) return;
  const signal = AbortSignal.any([own.signal, state.signal()]);
  loading.value = true;
  try {
    const [template, content] = await Promise.all([
      definitions.get(templateName.value, { signal }),
      contents.get(
        {
          templateName: templateName.value,
          cultureName: props.inline ? undefined : (selectedCulture.value ?? undefined),
        },
        { signal },
      ),
    ]);
    if (signal.aborted) return;
    definition.value = template;
    form.reset({ content: content.content ?? '' });
  } catch {
    // The HTTP layer reports failures; retry reloads without repeating a write.
    if (!signal.aborted) loadFailed.value = true;
  } finally {
    if (own === targetRequest) loading.value = false;
  }
}

async function loadReference(): Promise<void> {
  referenceRequest.abort();
  const own = new AbortController();
  referenceRequest = own;
  referenceLoading.value = false;
  referenceContent.value = '';
  referenceFailed.value = false;
  if (props.inline || !allowed.value || !templateName.value || !referenceCulture.value) return;
  const signal = AbortSignal.any([own.signal, state.signal()]);
  referenceLoading.value = true;
  try {
    const result = await contents.get(
      { templateName: templateName.value, cultureName: referenceCulture.value ?? undefined },
      { signal },
    );
    if (!signal.aborted) referenceContent.value = result.content ?? '';
  } catch {
    // Reference failures are independent of the editable target.
    if (!signal.aborted) referenceFailed.value = true;
  } finally {
    if (own === referenceRequest) referenceLoading.value = false;
  }
}

async function write(action: 'save' | 'restore'): Promise<void> {
  const restore = action === 'restore';
  if (busy.value || editingDisabled.value || (!restore && !form.validate())) return;
  const own = new AbortController();
  operation = own;
  const signal = AbortSignal.any([own.signal, state.signal()]);
  const input = {
    templateName: templateName.value,
    cultureName: props.inline ? undefined : (selectedCulture.value ?? undefined),
  };
  busy.value = true;
  try {
    if (restore) await contents.restoreToDefault(input, { signal });
    else {
      const result = await contents.update({ ...input, content: form.value.content }, { signal });
      if (signal.aborted) return;
      form.reset({ content: result.content ?? form.value.content });
    }
    if (signal.aborted) return;
    toaster.success('AbpUi::SavedSuccessfully');
    if (!restore && props.inline) {
      await router.push('/text-template-management/text-templates');
      return;
    }
    if (restore) await load();
    if (!signal.aborted && !props.inline && referenceCulture.value === selectedCulture.value)
      await loadReference();
  } catch {
    // The HTTP layer reports failures and binds validation errors; keep the draft.
  } finally {
    if (own === operation) busy.value = false;
  }
}

function customizePerCulture(): void {
  if (busy.value || !allowed.value || !definition.value) return;
  void router.push(
    `/text-template-management/text-templates/contents/${encodeURIComponent(templateName.value)}`,
  );
}
function cancelPending(): void {
  operation?.abort();
  targetRequest.abort();
  referenceRequest.abort();
}

const source = [context, templateName, () => props.inline] as const;
watch(
  source,
  () => {
    cancelPending();
    selectedCulture.value = languageOptions.value[0]?.value ?? null;
    referenceCulture.value =
      config.snapshot().localization.currentCulture.cultureName ?? selectedCulture.value;
  },
  { flush: 'sync', immediate: true },
);
watch(
  [...source, selectedCulture],
  () => {
    operation?.abort();
    busy.value = false;
    form.reset({ content: '' });
    void load();
  },
  { immediate: true },
);
watch(
  [...source, referenceCulture],
  () => {
    void loadReference();
  },
  { immediate: true },
);
watch(languageOptions, options => {
  if (props.inline) return;
  if (!options.some(option => option.value === selectedCulture.value))
    selectedCulture.value = options[0]?.value ?? null;
  if (!options.some(option => option.value === referenceCulture.value))
    referenceCulture.value = options[0]?.value ?? null;
});
onScopeDispose(cancelPending);
</script>
