# @lsw-abpvue/account

Public exports grouped by import entry. Value exports exist at runtime; type exports are used with `import type`. Source links lead to their declarations.

This reference follows **main**. The published npm channel is **alpha**; consult [versions and compatibility](/release/compatibility) before relying on a change that has not been published.

## Import

```ts
import { ChangePasswordTab } from '@lsw-abpvue/account';
```

## `@lsw-abpvue/account`

| Export                                 | Kind  | Source                                                                                                                              |
| -------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `ChangePasswordTab`                    | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/ChangePasswordTab.vue)          |
| `ForgotPasswordPage`                   | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/ForgotPasswordPage.vue)         |
| `LoginPage`                            | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/LoginPage.vue)                  |
| `ManageProfilePage`                    | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/ManageProfilePage.vue)          |
| `PersonalSettingsTab`                  | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/PersonalSettingsTab.vue)        |
| `RegisterPage`                         | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/RegisterPage.vue)               |
| `ResetPasswordPage`                    | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/ResetPasswordPage.vue)          |
| `DEFAULT_PERSONAL_SETTINGS_FORM_PROPS` | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/defaults/personal-settings.ts)             |
| `ManageProfileTabs`                    | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/enums/manage-profile-tabs.ts)              |
| `ManageProfileTab`                     | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/enums/manage-profile-tabs.ts)              |
| `authenticationFlowGuard`              | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/guards/authentication-flow.guard.ts)       |
| `AccountConfigOptions`                 | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/models/config-options.ts)                  |
| `AccountFormPropContributors`          | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/models/config-options.ts)                  |
| `provideAccount`                       | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/providers/account.provider.ts)             |
| `provideManageProfileTabs`             | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/providers/manage-profile-tabs.provider.ts) |
| `accountExtensionsResolver`            | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/resolvers/extensions.resolver.ts)          |
| `TwoFactorService`                     | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/services/two-factor.service.ts)            |
| `TwoFactorDeliveryUnavailableError`    | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/services/two-factor.service.ts)            |
| `TwoFactorProvider`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/services/two-factor.service.ts)            |
| `createAccountRoutes`                  | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/routes.ts)                                 |
| `ACCOUNT_APP_NAME`                     | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/tokens/config-options.token.ts)            |
| `ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS`  | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/tokens/config-options.token.ts)            |
| `ACCOUNT_RE_LOGIN_CONFIRMATION`        | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/tokens/config-options.token.ts)            |
| `ACCOUNT_REDIRECT_URL`                 | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/tokens/config-options.token.ts)            |
| `redirectUrlOf`                        | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/utils/redirect-url.ts)                     |

## `@lsw-abpvue/account/config`

| Export                 | Kind  | Source                                                                                                                                |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `AccountRouteNames`    | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/config/src/enums/route-names.ts)                 |
| `AccountRouteName`     | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/config/src/enums/route-names.ts)                 |
| `provideAccountConfig` | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/config/src/providers/account-config.provider.ts) |
