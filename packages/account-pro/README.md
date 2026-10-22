# @lsw-abpvue/account-pro

Account pages and administration for ABP commercial backends, aligned with Angular
Account 10.7.0. Uses Vue components, the shared theme contracts and the existing
extension system.

## Setup

```ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { provideAccountProConfig } from '@lsw-abpvue/account-pro/config';

const accountProviders = [provideAccountProConfig({ appName: 'Vue' })];
const accountRoutes = lazyRoutes('/account', () =>
  import('@lsw-abpvue/account-pro').then(m => m.createAccountProRoutes()),
);
```

Register the providers after OAuth. Use the Pro routes as the application's account
routes. Profile tabs register at startup and load their components on demand. `appName` must identify an
application configured in the backend's `AppUrlOptions`.

Authorization Code + PKCE remains the default. Its login, registration and recovery
navigation opens the authorization server, including its external identity providers.
Applications explicitly configured for password authentication use the local login,
registration, second-factor, recovery-code and forced-password-change pages.

To add the administrator settings tab and idle-session prompt, register
`provideAccountProAdminConfig()` from `@lsw-abpvue/account-pro/admin/config` after
`provideSettingManagementConfig()`. Account settings require
`AbpAccount.SettingManagement` and follow the backend's tenant-sharing rules.

## Features

- Local authentication, password rules and strength, configured reCAPTCHA v2/v3,
  email and phone confirmation, and password-reset mail callbacks.
- Personal information, timezone, object extensions, profile pictures with square
  cropping, password changes, authenticator setup and recovery codes, and 2FA.
- Personal security logs, session details and revocation, linked accounts,
  delegation, tenant membership and impersonation return.
- General, two-factor, CAPTCHA, external-provider, idle-session and passkey settings.

Passkey authentication and email-code login pages are absent from the Angular 10.7.0
Public UI. The admin service also exposes the runtime's email-login settings contract.

## Customization

`createAccountProRoutes(options)` accepts typed security-log entity, action and toolbar
contributors and personal-information edit-form contributors. The official
`personelInfoEntityPropContributors` spelling is accepted as an alias. Root defaults
can instead be registered with `provideAccountPro(options)`.

Use `AccountProComponents` with `ReplaceableComponentsService` and
`AccountProProfileTabs` with `ManageProfileTabsService`. Key values match Angular,
including `Account.AuthWrapper` and `Account.MySecurityLogs`. The five default
profile tabs are exported as lazy Vue components for composition. The official profile
tab keys also work with `ReplaceableComponentsService`; startup tab customizations
remain in place when the lazy account routes load.
`AccountProRouteNames` exposes the official route names for navigation configuration.

Public and administrator services use the `AbpAccountPublic` and `AbpAccountAdmin`
remote-service names. Configure those API URLs when the services run separately.
Both sets of HTTP methods and DTOs are generated in `/proxy`. Settings and picture
pages call those services directly; the picture page builds its multipart body.

QR encoding uses the external peer `qrcode@1.5.4` (MIT). Runtime credentials and
recovery codes are kept in memory; browser storage is not used for authentication
challenges.
