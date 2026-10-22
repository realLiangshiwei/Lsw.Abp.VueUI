<template>
  <section class="mb-3">
    <AbpButton
      variant="secondary"
      outline
      :aria-expanded="expanded ? 'true' : 'false'"
      :aria-controls="panelId"
      @click="toggle"
    >
      {{ $t('AbpIdentity::Filters') }}
    </AbpButton>
    <form
      v-if="expanded"
      :id="panelId"
      class="mt-3"
      :aria-label="$t('AbpIdentity::Filters')"
      novalidate
      @submit.prevent="apply"
    >
      <div v-if="lookup.state.value.status === 'error'" role="alert" class="mb-3">
        <p>{{ lookup.state.value.message || localization.t('AbpUi::ErrorLoadingDatatable') }}</p>
        <AbpButton variant="secondary" @click="lookup.load">
          {{ $t('AbpUi::Refresh') }}
        </AbpButton>
      </div>
      <AbpSpinner v-if="lookup.state.value.status === 'loading'" />
      <div class="row">
        <div v-for="field in lookupFields" :key="field.name" class="col-12 col-sm-6 col-lg-3">
          <AbpFormField v-slot="control" :label="$t(field.label)">
            <AbpInput
              v-model="search[field.name]"
              type="search"
              :name="`${field.name}Search`"
              :aria-label="`${$t(field.label)} ${$t('AbpUi::Search')}`"
              :disabled="lookup.state.value.status !== 'ready'"
            />
            <AbpSelect
              :id="control.id"
              v-model="draft[field.name]"
              :name="field.name"
              :options="lookupOptions(field.name)"
              :placeholder="$t('AbpIdentity::Dash')"
              :aria-describedby="control.describedBy"
              :disabled="lookup.state.value.status !== 'ready'"
            />
          </AbpFormField>
        </div>
        <div v-for="field in textFields" :key="field.name" class="col-12 col-sm-6 col-lg-3">
          <AbpFormField v-slot="control" :label="$t(field.label)">
            <AbpInput
              :id="control.id"
              v-model="draft[field.name]"
              :name="field.name"
              :aria-describedby="control.describedBy"
            />
          </AbpFormField>
        </div>
        <fieldset v-for="range in dateRanges" :key="range.minimum" class="col-12 col-sm-6">
          <legend class="fs-6">{{ $t(range.label) }}</legend>
          <div class="row">
            <div v-for="field in rangeFields(range)" :key="field.name" class="col-12 col-md-6">
              <AbpFormField
                v-slot="control"
                :label="field.label"
                :errors="dateErrors.includes(field.name) ? [invalidRange] : []"
              >
                <AbpDatePicker
                  :id="control.id"
                  v-model="draft[field.name]"
                  type="date"
                  :name="field.name"
                  :min="field.minimum ? undefined : draft[range.minimum]"
                  :max="field.minimum ? draft[range.maximum] : undefined"
                  :aria-label="`${$t(range.label)} ${field.label}`"
                  :aria-describedby="control.describedBy"
                  :invalid="control.invalid"
                  clearable
                />
              </AbpFormField>
            </div>
          </div>
          <div class="d-flex gap-2 mb-3">
            <AbpButton
              variant="secondary"
              outline
              size="sm"
              :aria-label="`${$t(range.label)} ${$t('AbpUi::Today')}`"
              @click="today(range)"
            >
              {{ $t('AbpUi::Today') }}
            </AbpButton>
            <AbpButton
              v-if="draft[range.minimum] || draft[range.maximum]"
              variant="secondary"
              outline
              size="sm"
              :aria-label="`${$t(range.label)} ${$t('AbpUi::Clear')}`"
              @click="clearRange(range)"
            >
              {{ $t('AbpUi::Clear') }}
            </AbpButton>
          </div>
        </fieldset>
        <div v-for="field in booleanFields" :key="field.name" class="col-12 col-sm-6 col-lg-3">
          <AbpFormField v-slot="control" :label="$t(field.label)">
            <AbpSelect
              :id="control.id"
              v-model="draft[field.name]"
              :name="field.name"
              :options="booleanOptions(field.name === 'notActive')"
              :placeholder="$t('AbpIdentity::Dash')"
              :aria-describedby="control.describedBy"
            />
          </AbpFormField>
        </div>
      </div>
      <div class="d-flex gap-2">
        <AbpButton variant="secondary" outline @click="clear">
          {{ $t('AbpUi::Clear') }}
        </AbpButton>
        <AbpButton type="submit" variant="primary">{{ $t('AbpUi::Refresh') }}</AbpButton>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpDatePicker,
  AbpFormField,
  AbpInput,
  AbpSelect,
  AbpSpinner,
  type AbpOption,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, reactive, ref, useId, watch } from 'vue';
import type {
  IdentityUserAdvancedFilters,
  IdentityUserDateFilter,
} from '../models/user-filters.js';
import {
  createIdentityUserAdvancedFilters,
  createIdentityUserFilterLookupLoader,
  filterIdentityUserLookups,
  getIdentityUserDateFilterErrors,
  getIdentityUserTodayDateRange,
  normalizeIdentityUserAdvancedFilters,
} from '../utils/user-filters.js';

const props = defineProps<{
  modelValue: IdentityUserAdvancedFilters;
  contextKey: string;
}>();
const emit = defineEmits<{
  'update:modelValue': [value: IdentityUserAdvancedFilters];
  apply: [value: IdentityUserAdvancedFilters];
}>();
const localization = useLocalization();
const lookup = createIdentityUserFilterLookupLoader(injectAbp(IdentityUserService));
const panelId = useId();
const expanded = ref(false);
const submitted = ref(false);
const draft = ref<IdentityUserAdvancedFilters>(
  normalizeIdentityUserAdvancedFilters(props.modelValue),
);
const search = reactive({ roleId: '', organizationUnitId: '' });
const lookupFields = [
  { name: 'roleId', label: 'AbpIdentity::Role' },
  { name: 'organizationUnitId', label: 'AbpIdentity::OrganizationUnit' },
] as const;
const textFields = [
  { name: 'userName', label: 'AbpIdentity::UserName' },
  { name: 'name', label: 'AbpIdentity::Name' },
  { name: 'surname', label: 'AbpIdentity::Surname' },
  { name: 'phoneNumber', label: 'AbpIdentity::PhoneNumber' },
  { name: 'emailAddress', label: 'AbpIdentity::EmailAddress' },
  { name: 'id', label: 'AbpIdentity::DisplayName:UserId' },
] as const;
const booleanFields = [
  { name: 'notActive', label: 'AbpIdentity::Active' },
  { name: 'emailConfirmed', label: 'AbpIdentity::EmailConfirmed' },
  { name: 'isLockedOut', label: 'AbpIdentity::Lock' },
  { name: 'isExternal', label: 'AbpIdentity::ExternalUser' },
] as const;
const dateRanges = [
  { minimum: 'minCreationTime', maximum: 'maxCreationTime', label: 'AbpIdentity::CreationDate' },
  {
    minimum: 'minModifitionTime',
    maximum: 'maxModifitionTime',
    label: 'AbpIdentity::ModificationDate',
  },
] as const;
const invalidRange = computed(() => localization.t('AbpValidation::ThisFieldIsNotValid.'));
const dateErrors = computed(() =>
  submitted.value ? getIdentityUserDateFilterErrors(draft.value) : [],
);

function rangeFields(
  range: (typeof dateRanges)[number],
): readonly { name: IdentityUserDateFilter; label: string; minimum: boolean }[] {
  return [
    {
      name: range.minimum,
      label: localization.t(
        range.minimum === 'minCreationTime'
          ? 'AbpIdentity::CreationStartDate'
          : 'AbpIdentity::ModificationStartDate',
      ),
      minimum: true,
    },
    {
      name: range.maximum,
      label: localization.t(
        range.maximum === 'maxCreationTime'
          ? 'AbpIdentity::CreationEndDate'
          : 'AbpIdentity::ModificationEndDate',
      ),
      minimum: false,
    },
  ];
}

function booleanOptions(inverted: boolean): readonly AbpOption[] {
  return [
    { value: null, label: localization.t('AbpIdentity::Dash') },
    { value: !inverted, label: localization.t('AbpUi::Yes') },
    { value: inverted, label: localization.t('AbpUi::No') },
  ];
}

function lookupOptions(field: 'roleId' | 'organizationUnitId'): readonly AbpOption[] {
  const state = lookup.state.value;
  const values =
    state.status === 'ready' ? state.value[field === 'roleId' ? 'roles' : 'organizationUnits'] : [];
  return [
    { value: null, label: localization.t('AbpIdentity::Dash') },
    ...filterIdentityUserLookups(values, search[field], draft.value[field]).map(value => ({
      value: value.id,
      label: value.label,
    })),
  ];
}

function today(range: (typeof dateRanges)[number]): void {
  const value = getIdentityUserTodayDateRange();
  draft.value[range.minimum] = value.from;
  draft.value[range.maximum] = value.to;
}

function clearRange(range: (typeof dateRanges)[number]): void {
  draft.value[range.minimum] = undefined;
  draft.value[range.maximum] = undefined;
}

function toggle(): void {
  expanded.value = !expanded.value;
  if (expanded.value && lookup.state.value.status === 'idle') void lookup.load();
}

function clear(): void {
  draft.value = createIdentityUserAdvancedFilters();
  search.roleId = '';
  search.organizationUnitId = '';
  submitted.value = false;
}

function apply(): void {
  submitted.value = true;
  if (getIdentityUserDateFilterErrors(draft.value).length > 0) return;
  const value = normalizeIdentityUserAdvancedFilters(draft.value);
  emit('update:modelValue', value);
  emit('apply', value);
}

watch(
  () => props.modelValue,
  value => {
    draft.value = normalizeIdentityUserAdvancedFilters(value);
    submitted.value = false;
  },
  { deep: true },
);
watch(
  () => props.contextKey,
  () => {
    lookup.reset();
    expanded.value = false;
    clear();
  },
  { flush: 'sync' },
);
onBeforeUnmount(() => lookup.reset());
</script>
