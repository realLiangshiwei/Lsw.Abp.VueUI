import { inject, makeEnvironmentProviders, provideAppInitializer } from '@lsw-abpvue/core';
import { ManageProfileTabsService } from '@lsw-abpvue/account-core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import ContactProfileTab from './ContactProfileTab.vue';
import PrintingTab from './PrintingTab.vue';

export const customTabs = makeEnvironmentProviders([
  provideAppInitializer(() => {
    inject(ManageProfileTabsService).add([
      {
        name: 'BookStore::Contact',
        text: 'BookStore::Contact',
        order: 3,
        component: ContactProfileTab,
      },
    ]);
    inject(SettingTabsService).add([
      {
        name: 'BookStore::Printing',
        order: 5,
        requiredPolicy: 'AbpIdentity.Users',
        component: PrintingTab,
      },
    ]);
  }),
]);
