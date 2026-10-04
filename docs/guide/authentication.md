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

## Configure the complete code-flow round trip

Set issuer to the browser-accessible authorization server, clientId to its seeded public SPA client, responseType to code, and scope to the API scopes plus offline_access when refresh is supported. redirectUri and postLogoutRedirectUri must match the client registrations exactly, including scheme, host, port and path. Do not put a client secret in a browser application.

Register OAuth before modules that deliberately override navigation tokens. Start with [runtime configuration](/guide/configuration), then re-run DbMigrator after editing seeded client addresses. A development request proxy can forward discovery/token calls; it does not make a private authorization server reachable to a redirected browser.

## Login, profile and logout are separate choices

| Command | What to verify |
| --- | --- |
| navigateToLogin('/books') | Server login, callback handling and return to an allowed application path |
| My account | Local account provider or authorization server /Account/Manage destination |
| logout() | End-session redirect and configured post-logout return |
| Refresh | Renewal supported by client/grant/scope and expired session behavior |

Changing the profile destination does not turn code-flow logout into local token clearing. Signing out only one application does not necessarily end sessions in other applications; verify the authorization server's own session policy.

## Authenticated state and API authorization

isAuthenticated is a computed ref used for reactive UI; granted policies come from refreshed backend configuration. Authentication and a policy grant are different checks. An authenticated user can still receive 403 on an endpoint. Menus should hide denied commands, route guards should prevent entering denied pages and the backend must enforce the policy.

Do not decode a token once at module import and cache an assumed permission set. Login/logout/tenant changes update configuration and trigger reactive checks. Use service state rather than maintaining a second disconnected current-user flag.

## Diagnose by the failing step

| Symptom | Check |
| --- | --- |
| Redirect URI rejected | Exact seeded client callback; database reseeding |
| Login server cannot open | Real issuer reachability and certificate, not just API proxy |
| Callback loops to login | state/callback handling, client scope and runtime addresses |
| My account goes to an unexpected host | NAVIGATE_TO_MANAGE_PROFILE provider order and account route registration |
| API fails after login | apiName URL, token audience/scope, tenant and CORS |
| Logout returns to the wrong page | postLogoutRedirectUri registration and server end-session response |

Check the browser's actual redirect URL and failed network request rather than changing multiple environment values at once. A local password flow requires backend support; it is not a fallback for a misconfigured code flow.
