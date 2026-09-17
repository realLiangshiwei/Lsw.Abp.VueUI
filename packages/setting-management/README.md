# @lsw-abpvue/setting-management

The settings page for [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an
**unofficial** Vue UI for the [ABP Framework](https://abp.io).

```bash
pnpm add @lsw-abpvue/setting-management
```

Two entry points, loaded at different times:

```ts
// main.ts: the menu entry and the tabs, at startup
import { provideSettingManagementConfig } from '@lsw-abpvue/setting-management/config';

provideSettingManagementConfig();
```

```ts
// routes.ts: the page, on the first navigation into it
import { lazyRoutes } from '@lsw-abpvue/core/router';

lazyRoutes('/setting-management', () =>
  import('@lsw-abpvue/setting-management').then(module => module.createSettingManagementRoutes()),
);
```

## What it is

A page that is nothing but a tab tree. The module brings two tabs of its own — emailing
and the time zone — and every other module adds its to the same tree.

| | |
| --- | --- |
| Emailing | the SMTP settings, and a test mail behind `SettingManagement.Emailing.Test` |
| Time zone | the server's default zone, where the backend's clock is UTC |

## Adding a tab

```ts
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';

provideAppInitializer(() => {
  inject(SettingTabsService).add([
    {
      name: 'MyModule.Settings',
      text: 'MyModule::Menu:Settings',
      requiredPolicy: 'MyModule.Settings',
      order: 300,
      component: defineAsyncComponent(() => import('./MySettingsTab.vue')),
    },
  ]);
});
```

`requiredPolicy` is checked the way every other permission is, and `visible()` is read
inside a computed for anything a permission cannot express — a feature switched off for
the current tenant, say. When no tab survives either check the menu entry goes away with
them, so nothing leads to an empty page.

## Compared with the Angular UI

Same component key, same route name, same tab names, same localization keys. What differs:

| Angular | Here |
| --- | --- |
| No time zone tab, though the backend and the MVC UI both have one | A tab, shown where the backend's clock is UTC |
| The test mail button is behind `SettingManagement.Emailing`, which is not what the endpoint checks | Behind `SettingManagement.Emailing.Test` |
| The emailing tab is shown to a tenant whose feature is off, and its endpoints then refuse | Hidden, the way the MVC UI hides it |
| The tab label is the tab's name | The name still works as one; `text` names a different key |
| Tab components are imported at startup | Asked for when a tab opens, which is the chunk the page came in |

Registered in the design documents' `api-parity-map.md`.

## Licence

MIT.
