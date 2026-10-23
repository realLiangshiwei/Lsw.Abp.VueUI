<template>
  <details class="mb-3">
    <summary>{{ $t('Saas::Filters') }}</summary>
    <form class="row g-3 mt-1" @submit.prevent="apply">
      <AbpFormField class="col-md-4" :label="$t('Saas::Edition')">
        <template #default="{ id }"
          ><AbpSelect :id="id" v-model="draft.editionId" :options="editionOptions"
        /></template>
      </AbpFormField>
      <AbpFormField class="col-md-4" :label="$t('Saas::DisplayName:ActivationState')">
        <template #default="{ id }"
          ><AbpSelect :id="id" v-model="draft.activationState" :options="states"
        /></template>
      </AbpFormField>
      <AbpFormField
        v-for="field in dates"
        :key="field.name"
        class="col-md-4"
        :label="`${$t(field.label)} ${field.bound}`"
      >
        <template #default="{ id }"
          ><AbpDatePicker :id="id" v-model="draft[field.name]" type="date"
        /></template>
      </AbpFormField>
      <p v-if="invalid" role="alert">{{ $t('AbpValidation::ThisFieldIsNotValid.') }}</p>
      <div class="col-12 d-flex gap-2">
        <AbpButton type="submit" :disabled="invalid">{{ $t('AbpUi::Refresh') }}</AbpButton>
        <AbpButton variant="secondary" outline @click="clear">{{ $t('AbpUi::Clear') }}</AbpButton>
      </div>
    </form>
  </details>
</template>

<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import { tenantActivationStateOptions, type GetTenantsInput } from '@lsw-abpvue/saas/proxy';
import {
  AbpButton,
  AbpDatePicker,
  AbpFormField,
  AbpSelect,
  type AbpOption,
} from '@lsw-abpvue/theme-shared';
import { computed, reactive } from 'vue';

const props = defineProps<{ editions: readonly AbpOption[] }>();
const editionOptions = computed(() => [
  { value: null, label: '-' },
  ...props.editions.filter(option => option.value !== null),
]);
const emit = defineEmits<{ apply: [filters: GetTenantsInput] }>();
const localization = useLocalization();
const empty = () => ({
  editionId: null as string | null,
  activationState: null as GetTenantsInput['activationState'],
  expirationDateMin: '',
  expirationDateMax: '',
  activationEndDateMin: '',
  activationEndDateMax: '',
});
const draft = reactive(empty());
const dates = [
  { name: 'expirationDateMin', label: 'Saas::DisplayName:ExpirationDate', bound: '≥' },
  { name: 'expirationDateMax', label: 'Saas::DisplayName:ExpirationDate', bound: '≤' },
  { name: 'activationEndDateMin', label: 'Saas::DisplayName:ActivationEndDate', bound: '≥' },
  { name: 'activationEndDateMax', label: 'Saas::DisplayName:ActivationEndDate', bound: '≤' },
] as const;
const states = computed(() => [
  { value: null, label: '-' },
  ...tenantActivationStateOptions.map(option => ({
    value: option.value,
    label: localization.t(`Saas::Enum:TenantActivationState.${option.key}`),
  })),
]);
const invalid = computed(
  () =>
    !!(
      (draft.expirationDateMin &&
        draft.expirationDateMax &&
        draft.expirationDateMin > draft.expirationDateMax) ||
      (draft.activationEndDateMin &&
        draft.activationEndDateMax &&
        draft.activationEndDateMin > draft.activationEndDateMax)
    ),
);
function apply() {
  if (invalid.value) return;
  emit('apply', {
    editionId: draft.editionId,
    activationState: draft.activationState,
    ...Object.fromEntries(
      dates.map(field => [
        field.name,
        draft[field.name]
          ? `${draft[field.name]}T${field.name.endsWith('Max') ? '23:59:59.999' : '00:00:00'}`
          : undefined,
      ]),
    ),
  });
}
function clear() {
  Object.assign(draft, empty());
  apply();
}
</script>
