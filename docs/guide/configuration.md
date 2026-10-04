# Configuration

Where the backend URL comes from, and how to change it without building again.

## Three levels, in order

```
public/dynamic-env.json     read at runtime, before the application starts
  ↓ (or /getEnvConfig, for a backend that serves the configuration itself)
VITE_API_URL, VITE_AUTH_URL, VITE_APP_URL
  ↓
src/env.ts                  what this build was born with
```

The first level is why the same build can be deployed to development, staging and
production: the file is served next to the application rather than compiled into it, so
changing it is an edit, not a release.

```json
{
  "apis": { "default": { "url": "https://api.example.com" } },
  "application": { "name": "BookStore", "baseUrl": "https://app.example.com" },
  "production": true,
  "oAuthConfig": {
    "issuer": "https://auth.example.com",
    "clientId": "BookStore_App",
    "scope": "offline_access BookStore",
    "responseType": "code",
    "redirectUri": "https://app.example.com",
    "postLogoutRedirectUri": "https://app.example.com",
    "silentRefreshRedirectUri": "https://app.example.com/silent-renew.html"
  }
}
```

::: warning Two things a deployment gets wrong
`dynamic-env.json` has to be served as `application/json`, and it must not be caught by
the SPA fallback that rewrites unknown paths to `index.html`. A frontend that receives
HTML where it expected JSON falls through to the next level silently, which looks like
"it ignored my configuration".
:::

## What the fields mean

| | |
| --- | --- |
| `apis.default.url` | The backend. Every generated service sends here unless its module names another API |
| `apis.<name>.url` | A module that lives on its own host. The name is ABP's `remoteServiceName` |
| `application.name` | Application name and browser title |
| `application.baseUrl` | Where the frontend is served, which is what the redirect URIs are built from |
| `oAuthConfig.issuer` | The identity server. The same host as the API in a single-host template |
| `oAuthConfig.responseType` | `code` hands the visitor to the identity server's login page. Anything else uses the account module's own form, over the password flow |
| `oAuthConfig.scope` | `offline_access` is what makes a refresh token possible |
| `oAuthConfig.metadataUrl` | Optional discovery URL; the development template points it at the same-origin proxy |
| `oAuthConfig.metadataSeed` | Optional token, revocation, user-info and JWKS endpoint overrides |

The default localization resource comes from backend application configuration. Configure the addresses for each deployed environment.

## Which login the visitor sees

`responseType: 'code'` is the authorization code flow with PKCE: the visitor is sent to
the identity server, signs in there, and comes back. This is the default, and the one to
use in production.

Anything else uses the account module's own login form and the resource owner password
flow. It keeps the visitor on your site, at the cost of your application handling the
password. ABP's own two-factor and lockout responses are handled either way.

## Environment variables

Useful in development, where a `.env.development` is easier than editing JSON:

```bash
VITE_API_URL=https://localhost:44305
VITE_AUTH_URL=https://localhost:44305
VITE_APP_URL=http://localhost:4200
```

They are read only where `dynamic-env.json` said nothing, so a deployment's file always
wins.

## Development proxy

The generated Vite application sends default API requests through `/api` on its own
origin. Discovery, token, revocation, user-info and JWKS requests use the frontend's
`/.well-known` and `/connect` proxy routes. The real issuer remains unchanged, and browser
login and logout redirects still go to the authentication server.

`VITE_API_URL` and `VITE_AUTH_URL` select the proxy targets independently. Named APIs keep
their explicitly configured URLs. This transformation runs only in Vite development;
production builds use the runtime configuration's real service URLs.

## Changing the port

During initial integration, use `switch-ui --port <n>`. For an already generated Vue app, synchronize its Vite and runtime configuration with backend CORS and seeded callback URLs, then run DbMigrator and doctor.
