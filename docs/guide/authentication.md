# Authentication

ABP's identity server is OpenIddict, and the frontend talks to it the way the Angular UI
does: the authorization code flow with PKCE by default, the resource owner password flow
when the application would rather host its own login form.

## Which flow

`oAuthConfig.responseType` in the [configuration](./configuration) decides:

| | |
| --- | --- |
| `code` | The visitor is sent to the identity server and comes back with a code. Silent renewal through a hidden iframe. This is the default |
| Anything else | The account module's login form, over the password flow. The password passes through your application |

Both end in the same place: an access token in storage, a `currentUser` in the
application configuration, and `grantedPolicies` deciding what renders.

## Signing in

```ts
const auth = inject(AuthService);

await auth.navigateToLogin();          // code flow: leaves for the identity server
await auth.login({ username, password, rememberMe: true });   // password flow
await auth.logout();
```

`login` rejects with a typed error rather than a bare `HttpErrorResponse`:

| | |
| --- | --- |
| `AuthError` | Wrong credentials, a locked-out user, a disabled account |
| `TwoFactorRequiredError` | Carries the `userId` and the `twoFactorToken` the second step needs |

ABP's token endpoint answers two-factor challenges with fields outside the OAuth error
shape, which is why they are read out and typed here rather than left in a raw body.

## Two factor

```ts
try {
  await auth.login({ username, password });
} catch (error) {
  if (error instanceof TwoFactorRequiredError) {
    // error.userId and error.twoFactorToken are what the second step needs
    await auth.login({ username, password, twoFactorProvider: 'Authenticator', twoFactorCode });
  }
}
```

The account module's login page does this for you — it shows the code field once the
first attempt comes back with `TwoFactorRequiredError` — and the API is there for an
application with its own login form.

## Tokens

Stored through `TokenStorage`, which is a token you can replace:
`provideAbpOAuth(withTokenStorage(MemoryTokenStorage))` keeps a session from outliving
the tab, and `ServerTokenStorage` is the seam a server-side renderer needs.
`BrowserTokenStorage` is the default.

A 401 refreshes once and retries; a second failure ends the session and sends the visitor
to the login page. Requests that were in flight while the refresh happened are queued
rather than each triggering their own refresh.

## Multi-tenancy

The tenant comes from one of three places, in this order: what the user picked (stored),
the `__tenant` in the URL, or the host name. `TenantService` resolves a name to an id
through `/api/abp/multi-tenancy/tenants/by-name/{name}`, and every request afterwards
carries the `__tenant` header.

Switching tenants clears a token issued for a different one. A token minted for tenant A
sent to tenant B only produces a string of 401s, and reasoning about which of them meant
what is not something to leave to the person using the application.
