<template>
  <section
    v-if="itemWithUserName.entityChange"
    class="abp-entity-change-details"
    style="white-space: pre-wrap; overflow-wrap: anywhere"
    :aria-label="localization.t('AbpAuditLogging::ChangeDetails')"
  >
    <h4>{{ title }}</h4>
    <dl>
      <template v-for="field in fields" :key="field.name">
        <dt>{{ localization.t(`AbpAuditLogging::${field.label}`) }}</dt>
        <dd>{{ itemWithUserName.entityChange[field.name] }}</dd>
      </template>
      <dt>{{ localization.t('AbpAuditLogging::UserName') }}</dt>
      <dd>{{ itemWithUserName.userName }}</dd>
      <dt>{{ localization.t('AbpAuditLogging::ChangeTime') }}</dt>
      <dd>{{ date(itemWithUserName.entityChange.changeTime) }}</dd>
    </dl>
    <div class="table-responsive">
      <table class="table table-striped">
        <caption class="visually-hidden">
          {{
            localization.t('AbpAuditLogging::Changes')
          }}
        </caption>
        <thead>
          <tr>
            <th v-for="key in ['PropertyName', 'OriginalValue', 'NewValue']" :key="key" scope="col">
              {{ localization.t(`AbpAuditLogging::${key}`) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(property, index) in itemWithUserName.entityChange.propertyChanges"
            :key="property.id ?? index"
          >
            <th scope="row">{{ property.propertyName }}</th>
            <td :class="{ 'text-danger': property.originalValue !== property.newValue }">
              {{ property.originalValue }}
            </td>
            <td :class="{ 'text-success': property.originalValue !== property.newValue }">
              {{ property.newValue }}
            </td>
          </tr>
          <tr v-if="!itemWithUserName.entityChange.propertyChanges?.length">
            <td colspan="3">{{ localization.t('AbpUi::NoDataAvailableInDatatable') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
<script setup lang="ts">
import type { EntityChangeWithUsernameDto } from '@lsw-abpvue/audit-logging/proxy';
import { computed } from 'vue';
import { useAuditLogging } from '../utils/use-audit-logging.js';
const props = defineProps<{ itemWithUserName: EntityChangeWithUsernameDto }>();
const { localization, date, changeType } = useAuditLogging();
const fields = [
  { name: 'entityId', label: 'EntityId' },
  { name: 'entityTypeFullName', label: 'EntityTypeFullName' },
  { name: 'tenantId', label: 'TenantId' },
] as const;
const title = computed(() => {
  const change = props.itemWithUserName.entityChange;
  if (!change) return '';
  const elapsed = Math.max(0, Date.now() - Date.parse(change.changeTime));
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const ago = Number.isFinite(elapsed)
    ? localization.t(
        `AbpAuditLogging::${days ? 'DaysAgo' : hours ? 'HoursAgo' : 'MinutesAgo'}`,
        String(days || hours || minutes),
      )
    : change.changeTime;
  return localization.t(
    props.itemWithUserName.userName
      ? 'AbpAuditLogging::DaysAgoWithUserTitle'
      : 'AbpAuditLogging::DaysAgoTitle',
    changeType(change.changeType),
    ago,
    props.itemWithUserName.userName ?? '',
  );
});
</script>
