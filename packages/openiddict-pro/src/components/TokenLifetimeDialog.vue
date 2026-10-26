<template>
  <AbpModal
    :visible="true"
    :busy="busy"
    :dirty="form.dirty"
    :aria-label="$t('AbpOpenIddict::TokenLifetime')"
    @update:visible="!$event && emit('close')"
  >
    <template #header
      ><h2 class="h5 mb-0">{{ $t('AbpOpenIddict::TokenLifetime') }}</h2></template
    >
    <p>{{ $t('AbpOpenIddict::TokenLifetimeHit') }}</p>
    <AbpSpinner v-if="busy && !loaded" />
    <p v-if="failed && !loaded" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="load">{{ $t('AbpUi::Refresh') }}</AbpButton>
    </p>
    <form v-if="loaded" id="token-lifetime-form" novalidate @submit.prevent="save">
      <fieldset :disabled="busy">
        <AbpFormField
          v-for="field in fields"
          :key="field"
          :for="field"
          :label="$t(`AbpOpenIddict::${field[0]?.toUpperCase()}${field.slice(1)}`)"
          :errors="
            form.controls[field].touched
              ? form.controls[field].errors.map(error => localization.t(error.key, ...error.params))
              : []
          "
        >
          <template #default="{ id, describedBy, invalid }">
            <AbpInput
              :id="id"
              v-model="form.controls[field].value"
              type="number"
              :min="-limit"
              :max="limit"
              :invalid="invalid"
              :aria-describedby="describedBy"
              @blur="form.controls[field].markAsTouched()"
            />
          </template>
        </AbpFormField>
      </fieldset>
    </form>
    <template #footer="{ close }">
      <AbpButton variant="secondary" outline :disabled="busy" @click="close">{{
        $t('AbpOpenIddict::Cancel')
      }}</AbpButton>
      <AbpButton type="submit" form="token-lifetime-form" :loading="busy" :disabled="!loaded">{{
        $t('AbpOpenIddict::Save')
      }}</AbpButton>
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import { inject, useLocalization } from '@lsw-abpvue/core';
import { OpenIddictProPolicyNames as Policy } from '@lsw-abpvue/openiddict-pro/config';
import {
  ApplicationService,
  type ApplicationDto,
  type ApplicationTokenLifetimeDto,
} from '@lsw-abpvue/openiddict-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpSpinner,
  useAbpForm,
  useServerValidation,
  useToaster,
  Validators,
  type AbpFormFieldDefinition,
} from '@lsw-abpvue/theme-shared';
import { onMounted, ref, watch } from 'vue';
import { useOpenIddictContext } from '../utils/use-openiddict-page.js';

const props = defineProps<{ application: ApplicationDto }>();
const emit = defineEmits<{ close: [] }>();
const service = inject(ApplicationService);
const state = useOpenIddictContext(Policy.ApplicationUpdate);
const { busy, failed } = state;
const toaster = useToaster();
const localization = useLocalization();
const loaded = ref(false);
const limit = 922337203685;
const fields = [
  'accessTokenLifetime',
  'authorizationCodeLifetime',
  'deviceCodeLifetime',
  'identityTokenLifetime',
  'refreshTokenLifetime',
  'userCodeLifetime',
  'requestTokenLifetime',
  'issuedTokenLifetime',
] as const satisfies readonly (keyof ApplicationTokenLifetimeDto)[];
const definition = {} as Record<(typeof fields)[number], AbpFormFieldDefinition<number | null>>;
for (const field of fields)
  definition[field] = { value: null, validators: [Validators.min(-limit), Validators.max(limit)] };
const form = useAbpForm(definition);
useServerValidation(form);

async function load(): Promise<void> {
  const id = props.application.id;
  if (!id) return;
  await state.run(
    signal => service.getTokenLifetime(id, { signal }),
    value => {
      form.reset(Object.fromEntries(fields.map(name => [name, value[name] ?? null])));
      loaded.value = true;
    },
  );
}
async function save(): Promise<void> {
  const id = props.application.id;
  if (!id || !loaded.value || !form.validate()) return;
  await state.run(
    signal => {
      form.clearServerErrors();
      return service.setTokenLifetime(id, form.value, { signal });
    },
    () => {
      toaster.success('AbpUi::SavedSuccessfully');
      emit('close');
    },
  );
}
watch(state.context, () => emit('close'), { flush: 'sync' });
onMounted(load);
</script>
