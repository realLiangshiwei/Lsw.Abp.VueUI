import { defineAsyncComponent } from 'vue';

export const HttpRequestCell = defineAsyncComponent(() => import('./HttpRequestCell.vue'));

export const EntityHistoryDialog = defineAsyncComponent(() => import('./EntityHistoryDialog.vue'));
/** Loads the history host so its application boundary can handle module failures. */
export async function loadEntityHistoryHost() {
  return (await import('./EntityHistoryHost.vue')).default;
}
export const EntityHistoryHost = defineAsyncComponent(loadEntityHistoryHost);
export const AuditLogsPage = defineAsyncComponent(() => import('./AuditLogsPage.vue'));
export const EntityChangesPage = defineAsyncComponent(() => import('./EntityChangesPage.vue'));
export const AuditLogDetailsDialog = defineAsyncComponent(
  () => import('./AuditLogDetailsDialog.vue'),
);
export const EntityChangeDetails = defineAsyncComponent(() => import('./EntityChangeDetails.vue'));
export const EntityChangeDetailsDialog = defineAsyncComponent(
  () => import('./EntityChangeDetailsDialog.vue'),
);
export const ErrorRateWidget = defineAsyncComponent(() => import('./ErrorRateWidget.vue'));
export const AverageExecutionDurationWidget = defineAsyncComponent(
  () => import('./AverageExecutionDurationWidget.vue'),
);
