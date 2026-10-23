import type { ConfigStateService, EnvironmentService } from '@lsw-abpvue/core';
import { TenantActivationState, type SaasTenantDto } from '@lsw-abpvue/saas/proxy';

export function canImpersonateTenant(
  tenant: SaasTenantDto,
  config: ConfigStateService,
  environment: EnvironmentService,
): boolean {
  const current = config.snapshot();
  return (
    !current.currentTenant.id &&
    !current.currentUser.impersonatorUserId &&
    environment.getEnvironment().oAuthConfig?.impersonation?.tenantImpersonation === true &&
    (tenant.activationState === TenantActivationState.Active ||
      (tenant.activationState === TenantActivationState.ActiveWithLimitedTime &&
        Date.parse(tenant.activationEndDate ?? '') > Date.now()))
  );
}
