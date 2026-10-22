import { ManageProfileTabsService } from '@lsw-abpvue/account-core';
import { ConfigStateService, defineService, inject } from '@lsw-abpvue/core';
import type { Component } from 'vue';
import { AccountProProfileTabs } from '../enums/profile-tabs.js';
import { AccountProProfileStateService } from './profile-state.service.js';

const initialization = defineService('AccountProProfileTabsInitialization', () => {
  const tabs = inject(ManageProfileTabsService);
  const state = inject(AccountProProfileStateService);
  const config = inject(ConfigStateService);
  const placeholder = () => null;
  let initialized = false;
  const twoFactorVisible = () =>
    state.canEnableTwoFactor.value &&
    config.snapshot().features.values['Identity.TwoFactor'] === 'Optional' &&
    config.snapshot().setting.values['Abp.Identity.TwoFactor.Behaviour'] === 'Optional' &&
    config.snapshot().setting.values['Abp.Identity.TwoFactor.UsersCanChange']?.toLowerCase() ===
      'true';

  return (components?: Readonly<Record<string, Component>>): void => {
    tabs.remove(['Account.ManageProfile.PersonalSettings', 'Account.ManageProfile.ChangePassword']);
    if (!initialized) {
      initialized = true;
      tabs.add(
        Object.values(AccountProProfileTabs)
          .map((name, index) => ({
            name,
            text: name,
            order: index + 1,
            component: placeholder,
            visible: () =>
              name === AccountProProfileTabs.ChangePassword
                ? state.profile.value?.isExternal !== true
                : name === AccountProProfileTabs.AuthenticatorApp ||
                    name === AccountProProfileTabs.TwoFactor
                  ? twoFactorVisible()
                  : true,
          }))
          .filter(tab => !tabs.search({ name: tab.name })),
      );
    }
    if (components)
      for (const tab of tabs.flat.value) {
        const component = components[tab.name];
        if (tab.component === placeholder && component) tabs.patch(tab.name, { component });
      }
  };
});

/**
 * Registers profile tabs once and fills their uncustomized default components.
 * @param components Default components keyed by the official profile tab names
 */
export function configureAccountProProfileTabs(
  components?: Readonly<Record<string, Component>>,
): void {
  inject(initialization)(components);
}
