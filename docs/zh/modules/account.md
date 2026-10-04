# 账户

提供本地登录、注册、密码找回和个人资料页面，共用租户与资料服务位于 `account-core`。

## 安装与注册

```bash
pnpm add @lsw-abpvue/account
```

```ts
import { provideAccountConfig } from '@lsw-abpvue/account/config';
import { provideManageProfileTabs } from '@lsw-abpvue/account';
import { lazyRoutes } from '@lsw-abpvue/core/router';

const accountProviders = [provideAccountConfig(), provideManageProfileTabs()];
const accountRoutes = lazyRoutes('/account', () =>
  import('@lsw-abpvue/account').then(module => module.createAccountRoutes()),
);
```

提供者放在 OAuth 之后，路由加入应用路由数组。

## 路由与 key

| 页面 | 路由 | Key |
| --- | --- | --- |
| 登录 | `/account/login` | `Account.LoginComponent` |
| 注册 | `/account/register` | `Account.RegisterComponent` |
| 忘记密码 | `/account/forgot-password` | `Account.ForgotPasswordComponent` |
| 重置密码 | `/account/reset-password` | `Account.ResetPasswordComponent` |
| 个人资料 | `/account/manage` | `Account.ManageProfileComponent` |

资料页面要求认证。本地登录与注册显隐遵循后端账户设置。授权码流程将登录、注册、忘记密码交给授权服务器，重置密码链接仍支持本地页面。

## 资料与扩展行为

`provideAccountConfig()` 将 My account 覆盖为本地资料路由，没有此覆盖时 OAuth 打开服务器资料页，见[认证](/zh/guide/authentication)。

`provideManageProfileTabs()` 注册个人信息和修改密码页签，可使用 Vue 组件增加自定义页签，账户表单贡献者用于可复用定制。示例见[资料页签](/zh/customization/profile-settings)。

二次验证登录取决于后端响应及发送能力，开源资料 API 不提供二次验证管理。
