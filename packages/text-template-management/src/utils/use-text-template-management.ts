import { ConfigStateService, inject, SessionStateService, usePermission } from '@lsw-abpvue/core';
import { TEXT_TEMPLATE_MANAGEMENT_FEATURES } from '@lsw-abpvue/text-template-management/common';
import { TextTemplateManagementPolicyNames as Policy } from '@lsw-abpvue/text-template-management/config';
import { computed, onScopeDispose, watch } from 'vue';

export function useTextTemplateManagement(policy: string = Policy.TextTemplates) {
  const config = inject(ConfigStateService);
  const session = inject(SessionStateService);
  const permission = usePermission();
  const features = inject(TEXT_TEMPLATE_MANAGEMENT_FEATURES);
  const context = computed(() =>
    JSON.stringify([
      config.snapshot().currentUser.id,
      config.snapshot().currentUser.isAuthenticated,
      config.snapshot().currentTenant.id,
      session.getTenant()?.id,
      config.snapshot().auth.grantedPolicies,
      features.value.enable,
    ]),
  );
  const allowed = computed(
    () =>
      config.snapshot().currentUser.isAuthenticated &&
      (session.getTenant()?.id ?? null) === (config.snapshot().currentTenant.id ?? null) &&
      features.value.enable &&
      permission.isGranted(Policy.TextTemplates) &&
      permission.isGranted(policy),
  );
  let lifetime = new AbortController();
  watch(
    context,
    () => {
      lifetime.abort();
      lifetime = new AbortController();
    },
    { flush: 'sync' },
  );
  onScopeDispose(() => lifetime.abort());

  return { config, permission, context, allowed, signal: () => lifetime.signal };
}
