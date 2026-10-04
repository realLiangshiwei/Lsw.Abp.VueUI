# Authentication

Register `provideAbpOAuth()` to implement the `AuthService` token declared by core. The configured `oAuthConfig.responseType` chooses the flow.

## Authorization code with PKCE

With `responseType: 'code'`, Login redirects to the authorization server. It authenticates the user, then returns a code to the registered frontend callback. The frontend exchanges the code and reloads application configuration. Use this flow for production browser applications.

Login, registration and forgot-password entry points hand over to that server. A reset-password link can still reach the local account route. Logout follows the authorization server's end-session flow and returns to `postLogoutRedirectUri`; clearing only local tokens would leave the server session active.

## Local password flow

For the non-code configuration, the account login page collects credentials and calls the token endpoint. The backend must allow this grant and local login. `TwoFactorRequiredError` can trigger the account page's second-factor step when the backend supplies it. Available delivery providers depend on backend capabilities.

Local logout clears the token and current user's list preferences, reloads anonymous configuration and navigates home.

## Use the service

```ts
import { AuthService, inject } from '@lsw-abpvue/core';

const auth = inject(AuthService);
const login = () => auth.navigateToLogin('/books');
const logout = () => auth.logout();
```

Call these methods from your event handlers. `isAuthenticated` is a computed ref; `isInternalAuth` identifies local authentication. `login(params)` is for a local credential form.

## My account

The user menu calls `NAVIGATE_TO_MANAGE_PROFILE`. OAuth's default opens `{issuer}/Account/Manage` with a return URL. Registering `provideAccountConfig()` after OAuth overrides that token to open the local `/account/manage` route. The generated template includes that override when the account module is selected. Choose and register the profile behavior your application needs; it is independent from the code-flow logout redirect.

## Tokens and tenant changes

`TokenStorage` defaults to browser storage and can be replaced through `withTokenStorage`. A 401 can trigger one shared token refresh and retry. Failed renewal ends the session. Switching tenant invalidates a token issued for the previous tenant and reloads configuration.

Match issuer, client id, scope, callback and logout addresses with the seeded OpenIddict client. See [configuration](./configuration) and [multi-tenancy](/core/multi-tenancy).
