import {
  AbpTenantService,
  ConfigStateService,
  defineService,
  inject,
  SessionStateService,
  type CurrentTenantDto,
  type ServiceOf,
} from '@lsw-abpvue/core';
import type { ComputedRef } from 'vue';

/**
 * Switching the tenant of the current session, which is what the box above a login form
 * does. No toast and no dialog: it answers whether the name was found, and the theme
 * that asked says so in its own words (difference 14).
 */
export const TenantBoxService = defineService('TenantBoxService', () => {
  const tenants = inject(AbpTenantService);
  const session = inject(SessionStateService);
  const configState = inject(ConfigStateService);

  async function apply(tenant: CurrentTenantDto | null): Promise<void> {
    session.setTenant(tenant);
    // The settings, the texts and the login schemes are all per tenant.
    await configState.refreshAppState();
  }

  return {
    currentTenant: session.getTenant$() as ComputedRef<CurrentTenantDto | null>,

    /**
     * @param name The tenant to switch to; empty goes back to the host
     * @returns `false` when no tenant goes by that name, with the session left as it was
     */
    switchTo: async (name: string): Promise<boolean> => {
      if (!name) {
        await apply(null);
        return true;
      }

      const found = await tenants.findTenantByName(name);
      // A name that resolves to nothing must not clear the tenant that is already set:
      // the user would be looking at the host's login form without having asked for it.
      if (!found.success) return false;

      await apply({
        ...(found.tenantId !== undefined ? { id: found.tenantId } : {}),
        ...(found.name !== undefined ? { name: found.name } : {}),
        isAvailable: true,
      });

      return true;
    },
  };
});
export type TenantBoxService = ServiceOf<typeof TenantBoxService>;

export const useTenantBox = (): TenantBoxService => inject(TenantBoxService);
