<template>
  <AbpModal
    :visible="true"
    :busy="busy"
    :aria-label="$t('AbpOpenIddict::GenerateAccessToken')"
    @update:visible="!$event && emit('close')"
  >
    <template #header
      ><h2 class="h5 mb-0">{{ $t('AbpOpenIddict::GenerateAccessToken') }}</h2></template
    >
    <AbpSpinner v-if="busy && !currentApplication" />
    <p v-if="failed && !currentApplication" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="load">{{ $t('AbpUi::Refresh') }}</AbpButton>
    </p>
    <p v-if="currentApplication && !canGenerate" role="alert">
      {{
        $t(
          currentApplication.clientType !== 'confidential'
            ? 'AbpOpenIddict::GenerateAccessTokenRequiresConfidentialClient'
            : 'AbpOpenIddict::ClientCredentialsFlowNotEnabledForThisApplication',
        )
      }}
    </p>
    <form
      v-if="currentApplication && canGenerate"
      id="generate-token-form"
      novalidate
      @submit.prevent="generate"
    >
      <fieldset :disabled="busy">
        <AbpFormField
          for="token-client-secret"
          :label="$t('AbpOpenIddict::ClientSecret')"
          required
          :errors="
            form.controls.clientSecret.touched
              ? form.controls.clientSecret.errors.map(error =>
                  localization.t(error.key, ...error.params),
                )
              : []
          "
        >
          <template #default="{ id, describedBy, invalid }"
            ><AbpInput
              :id="id"
              v-model="form.controls.clientSecret.value"
              type="password"
              autocomplete="off"
              :invalid="invalid"
              :aria-describedby="describedBy"
              @blur="form.controls.clientSecret.markAsTouched()"
          /></template>
        </AbpFormField>
        <AbpFormField
          v-if="scopes.length"
          for="token-scopes"
          :label="$t('AbpOpenIddict::SelectScopes')"
          ><AbpSelect id="token-scopes" v-model="selectedScopes" :options="scopes" multiple
        /></AbpFormField>
        <p v-else>{{ $t('AbpOpenIddict::NoAllowedScopesForApplication') }}</p>
      </fieldset>
    </form>
    <div v-if="result" class="abp-token-result" aria-live="polite">
      <AbpFormField for="generated-access-token" :label="$t('AbpOpenIddict::AccessToken')"
        ><AbpInput
          id="generated-access-token"
          :model-value="result.accessToken"
          type="textarea"
          readonly
          :rows="5"
      /></AbpFormField>
      <dl>
        <template v-for="field in ['tokenType', 'expiresIn', 'scope'] as const" :key="field"
          ><dt>{{ $t(`AbpOpenIddict::${field[0]?.toUpperCase()}${field.slice(1)}`) }}</dt>
          <dd>{{ result[field] }}</dd></template
        >
      </dl>
      <AbpButton variant="secondary" :disabled="!result.accessToken" @click="copy">{{
        $t('AbpOpenIddict::CopyToClipboard')
      }}</AbpButton>
    </div>
    <template #footer="{ close }">
      <AbpButton variant="secondary" outline :disabled="busy" @click="close">{{
        $t('AbpUi::Close')
      }}</AbpButton>
      <AbpButton
        type="submit"
        form="generate-token-form"
        :loading="busy"
        :disabled="!canGenerate"
        >{{ $t('AbpOpenIddict::GenerateAccessToken') }}</AbpButton
      >
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import { inject, useLocalization, WindowService } from '@lsw-abpvue/core';
import { OpenIddictProPolicyNames as Policy } from '@lsw-abpvue/openiddict-pro/config';
import {
  ApplicationService,
  type ApplicationDto,
  type GenerateAccessTokenDto,
} from '@lsw-abpvue/openiddict-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpSelect,
  AbpSpinner,
  useAbpForm,
  useServerValidation,
  useToaster,
  Validators,
  type AbpOptionValue,
} from '@lsw-abpvue/theme-shared';
import { computed, onMounted, onScopeDispose, ref, shallowRef, watch } from 'vue';
import { useOpenIddictContext } from '../utils/use-openiddict-page.js';

const props = defineProps<{ application: ApplicationDto }>();
const emit = defineEmits<{ close: [] }>();
const service = inject(ApplicationService);
const platform = inject(WindowService);
const state = useOpenIddictContext(Policy.ApplicationGenerateAccessToken);
const { busy, failed } = state;
const localization = useLocalization();
const toaster = useToaster();
const currentApplication = shallowRef<ApplicationDto>();
const result = shallowRef<GenerateAccessTokenDto>();
const selectedScopes = ref<AbpOptionValue[]>([]);
const form = useAbpForm({ clientSecret: { value: '', validators: [Validators.required()] } });
useServerValidation(form);
const scopes = computed(() =>
  [...(currentApplication.value?.scopes ?? [])].sort().map(value => ({ label: value, value })),
);
const canGenerate = computed(
  () =>
    state.allowed.value &&
    currentApplication.value?.clientType === 'confidential' &&
    currentApplication.value.allowClientCredentialsFlow,
);

async function load(): Promise<void> {
  const id = props.application.id;
  if (!id) return;
  await state.run(
    signal => service.get(id, { signal }),
    fresh => {
      currentApplication.value = fresh;
    },
  );
}
async function generate(): Promise<void> {
  const id = props.application.id;
  if (!id || !canGenerate.value || !form.validate()) return;
  result.value = undefined;
  await state.run(
    signal => {
      form.clearServerErrors();
      return service.generateAccessToken(
        id,
        {
          clientSecret: form.controls.clientSecret.value,
          scopes: selectedScopes.value.filter(
            (value): value is string => typeof value === 'string',
          ),
        },
        { signal },
      );
    },
    value => {
      result.value = value;
    },
  );
}
async function copy(): Promise<void> {
  const token = result.value?.accessToken;
  if (!token || !canGenerate.value) return;
  await state.run(
    async () => {
      try {
        const clipboard = platform.nativeWindow?.navigator.clipboard;
        if (!clipboard) return false;
        await clipboard.writeText(token);
        return true;
      } catch {
        return false;
      }
    },
    copied => {
      if (copied) toaster.success('AbpOpenIddict::Copied');
      else toaster.error('AbpOpenIddict::FailedToCopyToClipboard');
    },
  );
}
watch(state.context, () => emit('close'), { flush: 'sync' });
onScopeDispose(() => {
  form.reset();
  result.value = undefined;
  selectedScopes.value = [];
});
onMounted(load);
</script>

<style scoped>
.abp-token-result {
  overflow-wrap: anywhere;
}
</style>
