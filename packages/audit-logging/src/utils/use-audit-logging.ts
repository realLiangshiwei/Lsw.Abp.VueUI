import { AuditLoggingPolicyNames, isAuditLoggingEnabled } from '@lsw-abpvue/audit-logging/config';
import { ConfigStateService, inject, useLocalization, usePermission } from '@lsw-abpvue/core';
import { computed } from 'vue';

export function formatAuditDate(value: string | undefined, cultureName?: string): string {
  if (!value || !Number.isFinite(Date.parse(value))) return value ?? '';
  return new Intl.DateTimeFormat(cultureName, { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function useAuditLogging() {
  const config = inject(ConfigStateService);
  const permission = usePermission();
  const localization = useLocalization();
  const allowed = computed(
    () =>
      config.snapshot().currentUser.isAuthenticated &&
      isAuditLoggingEnabled(config) &&
      permission.isGranted(AuditLoggingPolicyNames.AuditLogging),
  );
  const context = computed(() =>
    JSON.stringify([
      config.snapshot().currentUser.id,
      config.snapshot().currentUser.isAuthenticated,
      config.snapshot().currentTenant.id,
      config.snapshot().auth.grantedPolicies,
      config.snapshot().features.values,
      config.snapshot().globalFeatures.enabledFeatures,
    ]),
  );
  function date(value?: string): string {
    return formatAuditDate(value, config.snapshot().localization.currentCulture.cultureName);
  }
  function changeType(value?: number): string {
    const key = value === undefined ? undefined : ['Created', 'Updated', 'Deleted'][value];
    return key ? localization.t(`AbpAuditLogging::${key}`) : '';
  }
  return { config, permission, localization, allowed, context, date, changeType };
}
