# @lsw-abpvue/account

按导入入口列出公开导出。值导出存在于运行时；类型导出使用 `import type`。源码链接指向对应声明。

本参考跟随 **main**。npm 已发布通道是 **alpha**；使用尚未发布的变更前请查看[版本与兼容性](/zh/release/compatibility)。

## 导入

```ts
import { ChangePasswordTab } from '@lsw-abpvue/account';
```

## `@lsw-abpvue/account`

| 导出                                   | 类别 | 源码                                                                                                                              |
| -------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------- |
| `ChangePasswordTab`                    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/ChangePasswordTab.vue)          |
| `ForgotPasswordPage`                   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/ForgotPasswordPage.vue)         |
| `LoginPage`                            | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/LoginPage.vue)                  |
| `ManageProfilePage`                    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/ManageProfilePage.vue)          |
| `PersonalSettingsTab`                  | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/PersonalSettingsTab.vue)        |
| `RegisterPage`                         | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/RegisterPage.vue)               |
| `ResetPasswordPage`                    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/components/ResetPasswordPage.vue)          |
| `DEFAULT_PERSONAL_SETTINGS_FORM_PROPS` | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/defaults/personal-settings.ts)             |
| `ManageProfileTabs`                    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/enums/manage-profile-tabs.ts)              |
| `ManageProfileTab`                     | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/enums/manage-profile-tabs.ts)              |
| `authenticationFlowGuard`              | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/guards/authentication-flow.guard.ts)       |
| `AccountConfigOptions`                 | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/models/config-options.ts)                  |
| `AccountFormPropContributors`          | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/models/config-options.ts)                  |
| `provideAccount`                       | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/providers/account.provider.ts)             |
| `provideManageProfileTabs`             | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/providers/manage-profile-tabs.provider.ts) |
| `accountExtensionsResolver`            | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/resolvers/extensions.resolver.ts)          |
| `TwoFactorService`                     | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/services/two-factor.service.ts)            |
| `TwoFactorDeliveryUnavailableError`    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/services/two-factor.service.ts)            |
| `TwoFactorProvider`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/services/two-factor.service.ts)            |
| `createAccountRoutes`                  | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/routes.ts)                                 |
| `ACCOUNT_APP_NAME`                     | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/tokens/config-options.token.ts)            |
| `ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS`  | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/tokens/config-options.token.ts)            |
| `ACCOUNT_RE_LOGIN_CONFIRMATION`        | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/tokens/config-options.token.ts)            |
| `ACCOUNT_REDIRECT_URL`                 | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/tokens/config-options.token.ts)            |
| `redirectUrlOf`                        | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/src/utils/redirect-url.ts)                     |

## `@lsw-abpvue/account/config`

| 导出                   | 类别 | 源码                                                                                                                                |
| ---------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `AccountRouteNames`    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/config/src/enums/route-names.ts)                 |
| `AccountRouteName`     | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/config/src/enums/route-names.ts)                 |
| `provideAccountConfig` | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/account/config/src/providers/account-config.provider.ts) |
