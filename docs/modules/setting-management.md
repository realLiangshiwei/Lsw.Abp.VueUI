# Setting management

The settings page and its tab tree.

```ts
provideSettingManagementConfig();

lazyRoutes('/setting-management', () =>
  import('@lsw-abpvue/setting-management').then(m => m.createSettingManagementRoutes()),
);
```

| Page | Route | Component key |
| --- | --- | --- |
| Settings | `/setting-management` | `SettingManagement.SettingsComponent` |

## The tabs

The page renders the tab tree contributed by packages. Email, account and time zone tabs
ship with it. Their visibility follows the backend's permissions, features and capabilities.

```ts
import { inject, provideAppInitializer } from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import { defineAsyncComponent } from 'vue';

provideAppInitializer(() => {
  inject(SettingTabsService).add([
    {
      name: 'BookStore::Printing',
      order: 5,
      component: defineAsyncComponent(() => import('./PrintingTab.vue')),
    },
  ]);
});
```

`name` is both the tab id and its localization key, matching the Angular convention.
Use that same name when reordering, replacing or hiding a tab.

## Account settings

The default tab reads `Abp.Account.IsSelfRegistrationEnabled` and
`Abp.Account.EnableLocalLogin` from application configuration. It is visible to signed-in
users and shows disabled switches: the open-source account module exposes these values
but has no account-settings update endpoint.

A host with a writable account settings API can replace the service:

```ts
import { AccountSettingsService } from '@lsw-abpvue/setting-management/config';
import { accountSettingsApi } from './account-settings-api';

const accountSettingsProvider = {
  provide: AccountSettingsService,
  useValue: {
    requiredPolicy: 'AbpAccount.SettingManagement',
    get: () => accountSettingsApi.get(),
    update: settings => accountSettingsApi.update(settings),
  } satisfies AccountSettingsService,
};
```

Add this provider to the application's providers alongside `provideSettingManagementConfig()`.
Without an explicit `requiredPolicy`, a writable adapter requires
`AbpAccount.SettingManagement`. The save button appears only when `update` exists, and a
successful save refreshes application configuration.

## Email settings

The form the backend's `EmailSettingsAppService` describes, plus its "send a test email"
endpoint. The test button is gated on the permission that endpoint actually checks, which
is not the same one as the page.

The tab is not rendered at all for a tenant whose email feature is off — the backend
would refuse every save, and a form that cannot be saved is worse than no form.

## Time zone

Behind ABP's `Abp.Timing.TimeZone` setting, and only shown when the backend has timezone
support switched on.
