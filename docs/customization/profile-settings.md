# Profile and settings tabs

Both pages render a contributed tab tree. Tab `name` is its stable id and, unless `text` is provided, its localization key. Use the same name to patch or remove it.

## Profile tabs

`provideManageProfileTabs()` from `@lsw-abpvue/account` registers the default personal-details and password tabs. Add an application tab using a Vue component:

```ts
import { defineAsyncComponent } from 'vue';
import { inject, provideAppInitializer } from '@lsw-abpvue/core';
import { provideManageProfileTabs } from '@lsw-abpvue/account';
import { ManageProfileTabsService } from '@lsw-abpvue/account-core';

const defaultTabs = provideManageProfileTabs();
const customTabs = provideAppInitializer(() => {
  inject(ManageProfileTabsService).add([
    { name: 'BookStore::ApiKeys', order: 3, component: defineAsyncComponent(() => import('./ApiKeysTab.vue')) },
  ]);
});
```

This affects the local `/account/manage` page. It does not customize the authentication server's own `/Account/Manage` page.

## Settings tabs

Register `provideSettingManagementConfig()` first, then add a tab through `SettingTabsService` in an application initializer:

```ts
import { inject, provideAppInitializer } from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import PrintingTab from './PrintingTab.vue';

const printingSettings = provideAppInitializer(() => {
  inject(SettingTabsService).add([
    { name: 'BookStore::Printing', order: 5, requiredPolicy: 'BookStore.Settings', component: PrintingTab },
  ]);
});
```

A tab component owns its API calls and validation. `requiredPolicy` and `visible` control visibility. Keep stable names when changing labels, and refresh effective settings after a successful custom save.
