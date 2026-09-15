import { ManageProfileStateService, ManageProfileTabsService } from '@lsw-abpvue/account-core';
import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import ChangePasswordTab from '../components/ChangePasswordTab.vue';
import PersonalSettingsTab from '../components/PersonalSettingsTab.vue';
import { ManageProfileTabs } from '../enums/manage-profile-tabs.js';

/**
 * The two tabs this module puts on the profile page. Registered at application scope
 * rather than on the route, so a module that adds a third one does not have to know when
 * the account module's routes were loaded.
 */
export function provideManageProfileTabs(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const state = inject(ManageProfileStateService);

      inject(ManageProfileTabsService).add([
        {
          name: ManageProfileTabs.ChangePassword,
          text: 'AbpAccount::ProfileTab:Password',
          iconClass: 'bi bi-key',
          component: ChangePasswordTab,
          order: 1,
          // An account that signs in somewhere else has no password here to change.
          visible: () => state.profile.value?.isExternal !== true,
        },
        {
          name: ManageProfileTabs.PersonalSettings,
          text: 'AbpAccount::ProfileTab:PersonalInfo',
          iconClass: 'bi bi-person',
          component: PersonalSettingsTab,
          order: 2,
        },
      ]);
    }),
  ]);
}
