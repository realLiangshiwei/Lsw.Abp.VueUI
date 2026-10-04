# Account

Provides local login, registration, password recovery and profile pages. Shared tenant and profile services live in `account-core`.

## Install and register

```bash
pnpm add @lsw-abpvue/account@alpha
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

Add the providers after OAuth and the route to your application routes.

## Routes and keys

| Page | Route | Key |
| --- | --- | --- |
| Login | `/account/login` | `Account.LoginComponent` |
| Register | `/account/register` | `Account.RegisterComponent` |
| Forgot password | `/account/forgot-password` | `Account.ForgotPasswordComponent` |
| Reset password | `/account/reset-password` | `Account.ResetPasswordComponent` |
| Profile | `/account/manage` | `Account.ManageProfileComponent` |

The profile requires authentication. Local login and registration visibility follow the backend account settings. Code flow delegates login, registration and forgot password to the authorization server; reset-password links remain supported locally.

## Profile and extension behavior

`provideAccountConfig()` overrides My account navigation to the local profile route. Without that override, OAuth opens the server profile page. [Authentication](/guide/authentication) explains the choice.

Personal details and change password are profile tabs registered by `provideManageProfileTabs()`. Add custom tabs using Vue components, and use account form contributors for reusable customization. [Profile tabs](/customization/profile-settings) provides an example.

Second-factor login behavior depends on backend responses and delivery capabilities. Two-factor administration is not supplied by the open-source profile API. [Public exports](/api/account) and [shared services](/api/account-core) list the available APIs.
