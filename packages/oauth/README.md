# @lsw-abpvue/oauth

Authentication for [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an
**unofficial** Vue UI for the [ABP Framework](https://abp.io). It fills in the
`AuthService` that `@lsw-abpvue/core` declares but never implements.

```bash
pnpm add @lsw-abpvue/oauth
```

## Setup

```ts
import { createAbpApp, provideAbpCore, withOptions } from '@lsw-abpvue/core';
import { provideAbpOAuth } from '@lsw-abpvue/oauth';

const { mount } = await createAbpApp(App, {
  providers: [provideAbpCore(withOptions({ environment })), provideAbpOAuth()],
});
```

Which flow runs is decided by the environment, not by the code — the same rule ABP's
Angular UI follows:

```ts
oAuthConfig: {
  issuer: 'https://localhost:44384',
  clientId: 'BookStore_App',
  scope: 'offline_access BookStore',
  responseType: 'code',                    // omit it for the password flow
  redirectUri: 'https://localhost:4200',
}
```

## The two flows

**Authorization code with PKCE** (`responseType: 'code'`) hands the visitor to the
identity server and takes the callback apart when they come back: the token is adopted,
the culture ABP rendered its login page in becomes the UI's, and the address bar is put
back the way it was. Renewal is `oidc-client-ts`'s silent renew.

**Password** collects the credentials itself and posts them to the token endpoint. It is
written here rather than delegated, because `oidc-client-ts` takes its extra token
parameters from the settings object rather than per call — so ABP's two-factor answer
could not be replied to — and its error type drops every field the RFC does not name,
which is exactly where ABP puts `userId` and `twoFactorToken`.

```ts
const auth = inject(AuthService);

try {
  await auth.login({ username, password, rememberMe, redirectUrl: '/' });
} catch (error) {
  if (error instanceof TwoFactorRequiredError) {
    // Ask for the code, then send the same credentials again with the second factor.
    await auth.login({ username, password, twoFactorProvider: 'Authenticator', twoFactorCode });
  }
}
```

## Where the tokens live

In local storage, under the key names `angular-oauth2-oidc` uses, so a solution that
switches UIs on the same origin keeps its session. Anything running in the page can read
them; an application that would rather pay a redirect on every reload says so:

```ts
provideAbpOAuth(withTokenStorage(MemoryTokenStorage));
```

## What happens on a 401

The interceptor renews the token and replays the request once. Concurrent failures share
one renewal, so five requests failing together ask the token endpoint once. A renewal
that the identity server refuses ends the session: the tokens go, the configuration is
reloaded as an anonymous visitor, and the login page follows.

An endpoint that answers 401 in the normal course of things says so with a filter, and
neither the renewal nor the redirect happens:

```ts
inject(AuthErrorFilterService).add({
  id: 'presence-poll',
  executable: true,
  execute: error => error.url.includes('/api/presence'),
});
```

## How it lines up with the Angular UI

| ABP Angular | Here |
|---|---|
| `provideAbpOAuth()` | same |
| `angular-oauth2-oidc` | `oidc-client-ts` |
| `AbpOAuthService` | `AbpOAuthService` |
| `OAuthApiInterceptor` | `authInterceptor` |
| `OAuthStorage` + `Browser/Memory/ServerTokenStorageService` | `TokenStorage` and its three implementations, in `core` |
| `OAuthErrorFilterService` | `AuthErrorFilterService`, in `core`, judging `AbpHttpError` |
| `RememberMeService` | same |

Differences are listed in
[`api-parity-map` §8](https://github.com/realLiangshiwei/Lsw.Abp.VueUI.Docs).

## License

MIT. Not affiliated with or endorsed by Volosoft or the ABP Framework team.
