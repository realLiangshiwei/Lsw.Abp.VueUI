<template>
  <form
    class="abp-audit-filters mb-3"
    novalidate
    :aria-label="localization.t('AbpUi::Search')"
    @submit.prevent="apply"
  >
    <fieldset :disabled="disabled">
      <div class="row">
        <AbpFormField
          v-for="field in fields"
          :key="field.name"
          v-slot="control"
          class="col-12 col-md-6 col-lg-3"
          :label="localization.t(field.label)"
          :errors="invalid ? [localization.t('AbpValidation::ThisFieldIsNotValid.')] : []"
        >
          <AbpDatePicker
            v-if="field.type === 'date'"
            :id="control.id"
            v-model="draft[field.name]"
            :type="changes ? 'date' : 'datetime'"
            :name="field.name"
            clearable
            :invalid="control.invalid"
            :aria-describedby="control.describedBy"
          />
          <AbpSelect
            v-else-if="field.options"
            :id="control.id"
            :model-value="draft[field.name]"
            :options="field.options"
            :name="field.name"
            :invalid="control.invalid"
            :aria-describedby="control.describedBy"
            @update:model-value="
              draft[field.name] = $event === null ? undefined : String($event);
              apply();
            "
          />
          <AbpInput
            v-else
            :id="control.id"
            :model-value="draft[field.name]"
            :type="field.type === 'number' ? 'number' : 'text'"
            :min="field.type === 'number' ? 0 : undefined"
            :max="field.type === 'number' ? 2147483647 : undefined"
            :step="field.type === 'number' ? 1 : undefined"
            :name="field.name"
            :invalid="control.invalid"
            :aria-describedby="control.describedBy"
            @update:model-value="draft[field.name] = $event === null ? undefined : String($event)"
          />
        </AbpFormField>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <AbpButton variant="primary" type="submit">{{
          localization.t('AbpAuditLogging::Refresh')
        }}</AbpButton>
        <AbpButton variant="secondary" @click="clear">{{
          localization.t('AbpUi::Clear')
        }}</AbpButton>
        <AbpButton
          v-if="canExport"
          variant="secondary"
          :loading="exporting"
          @click="exportValues"
          >{{ localization.t('AbpAuditLogging::ExportToExcel') }}</AbpButton
        >
      </div>
    </fieldset>
  </form>
</template>
<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpDatePicker,
  AbpFormField,
  AbpInput,
  AbpSelect,
  type AbpOption,
} from '@lsw-abpvue/theme-shared';
import { computed, reactive, ref } from 'vue';
import { HTTP_METHODS, HTTP_STATUS_CODES } from '../constants/http.js';
import { validAuditFilters, type AuditFilterDraft } from '../utils/filters.js';
const props = defineProps<{
  changes?: boolean | undefined;
  disabled?: boolean | undefined;
  canExport: boolean;
  exporting: boolean;
}>();
const emit = defineEmits<{ apply: [draft: AuditFilterDraft]; export: [draft: AuditFilterDraft] }>();
const localization = useLocalization();
const draft = reactive<AuditFilterDraft>({});
const invalid = ref(false);
interface Field {
  name: string;
  label: string;
  type?: string | undefined;
  options?: AbpOption[] | undefined;
}
const fields = computed<Field[]>(() => {
  const options = (values: AbpOption[]) => [{ value: null, label: '-' }, ...values];
  const field = (name: string, label: string, type?: string): Field => ({
    name,
    label: `AbpAuditLogging::${label}`,
    type,
  });
  if (props.changes)
    return [
      field('startDate', 'EntityChangeStartTime', 'date'),
      field('endDate', 'EntityChangeEndTime', 'date'),
      {
        ...field('entityChangeType', 'ChangeType'),
        options: options(
          ['Created', 'Updated', 'Deleted'].map((key, value) => ({
            value: String(value),
            label: localization.t(`AbpAuditLogging::${key}`),
          })),
        ),
      },
      field('entityId', 'EntityId'),
      field('entityTypeFullName', 'EntityTypeFullName'),
    ];
  return [
    field('startTime', 'StartDate', 'date'),
    field('endTime', 'EndDate', 'date'),
    field('userName', 'UserName'),
    field('url', 'Url'),
    field('minExecutionDuration', 'MinDuration', 'number'),
    field('maxExecutionDuration', 'MaxDuration', 'number'),
    {
      ...field('httpMethod', 'HttpMethod'),
      options: options(HTTP_METHODS.map(value => ({ value, label: value }))),
    },
    {
      ...field('httpStatusCode', 'HttpStatusCode'),
      options: options(
        HTTP_STATUS_CODES.map(item => ({
          value: String(item.code),
          label: `${item.code} - ${item.message}`,
        })),
      ),
    },
    field('applicationName', 'ApplicationName'),
    field('clientIpAddress', 'ClientIpAddress'),
    field('correlationId', 'CorrelationId'),
    {
      ...field('hasException', 'HasException'),
      options: options([
        { value: 'true', label: localization.t('AbpAuditLogging::Yes') },
        { value: 'false', label: localization.t('AbpAuditLogging::No') },
      ]),
    },
  ];
});
function validate(): boolean {
  invalid.value = !validAuditFilters(draft, props.changes);
  return !invalid.value;
}
function apply(): void {
  if (validate()) emit('apply', { ...draft });
}
function exportValues(): void {
  if (validate()) emit('export', { ...draft });
}
function clear(): void {
  for (const key of Object.keys(draft)) delete draft[key];
  apply();
}
</script>
