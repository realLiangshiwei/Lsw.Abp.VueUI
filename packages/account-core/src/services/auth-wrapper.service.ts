import {
  ConfigStateService,
  defineService,
  inject,
  MultiTenancyService,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { computed, type ComputedRef } from 'vue';

/** ABP treats a setting it never wrote as on; only an explicit `false` turns one off. */
function isOn(value: ComputedRef<string | undefined>): ComputedRef<boolean> {
  return computed(() => value.value?.toLowerCase() !== 'false');
}

/**
 * What the account pages and the shell around them have to agree on: whether this client
 * may show a login form at all, whether anyone may sign themselves up, and whether the
 * tenant is the visitor's to choose.
 */
export const AuthWrapperService = defineService('AuthWrapperService', () => {
  const configState = inject(ConfigStateService);
  const multiTenancy = inject(MultiTenancyService);

  return {
    isMultiTenancyEnabled: multiTenancy.isEnabled,

    /**
     * False when the client is configured to authenticate somewhere else entirely. The
     * login page then says so instead of collecting a password nothing would accept.
     */
    isLocalLoginEnabled: isOn(configState.getSetting('Abp.Account.EnableLocalLogin')),

    isSelfRegistrationEnabled: isOn(
      configState.getSetting('Abp.Account.IsSelfRegistrationEnabled'),
    ),

    /**
     * False once the host name itself named a tenant: that session is pinned to it, and
     * offering a switch would offer something the next request would undo.
     */
    isTenantBoxVisible: computed(
      () => multiTenancy.isEnabled.value && multiTenancy.domainTenant.value === null,
    ),
  };
});
export type AuthWrapperService = ServiceOf<typeof AuthWrapperService>;

export const useAuthWrapper = (): AuthWrapperService => inject(AuthWrapperService);
