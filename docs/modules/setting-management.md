# Setting management

A settings page whose tab tree can be extended by modules and the host.

## Install and register

```bash
pnpm add @lsw-abpvue/setting-management@alpha
```

```ts
import { provideSettingManagementConfig } from '@lsw-abpvue/setting-management/config';
import { lazyRoutes } from '@lsw-abpvue/core/router';

const moduleConfig = provideSettingManagementConfig();
const moduleRoute = lazyRoutes('/setting-management', () =>
  import('@lsw-abpvue/setting-management').then(module => module.createSettingManagementRoutes()),
);
```

Add `moduleConfig` to startup providers and `moduleRoute` to your routes. Keep the matching ABP backend module installed.

## Routes and keys

| Page | Route | Key |
| --- | --- | --- |
| Settings | `/setting-management` | `SettingManagement.SettingsComponent` |

## Permissions and configuration

Email access uses `SettingManagement.Emailing`; sending a test uses `SettingManagement.Emailing.Test`. Timezone access uses `SettingManagement.TimeZone` and backend timezone capability. Tab visibility follows permissions, features and API availability.

## Behavior and customization

Email, account and timezone tabs are provided. The default account tab displays local-login and self-registration settings as read-only because the open-source account module has no update endpoint for them. A host can replace `AccountSettingsService` from `/config` with a writable adapter; its required policy must match that API. Register settings config before feature config. Custom tabs use `SettingTabsService`; see [profile and settings tabs](/customization/profile-settings).

Services and DTOs are in `@lsw-abpvue/setting-management/proxy`; [public exports](/api/setting-management) list configuration, types and extension options.
