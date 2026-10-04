# Deploying an application

The frontend is a static SPA; the API and authorization server remain independently deployed services. Choose the frontend base path first, then align assets, runtime configuration, routing and authentication callbacks.

## Root-path runtime configuration

For `https://app.example.com`, deploy this as `dynamic-env.json` next to `index.html`:

```json
{
  "production": true,
  "application": { "name": "BookStore", "baseUrl": "https://app.example.com" },
  "apis": { "default": { "url": "https://api.example.com" } },
  "oAuthConfig": {
    "issuer": "https://auth.example.com",
    "clientId": "BookStore_App",
    "scope": "offline_access BookStore",
    "responseType": "code",
    "redirectUri": "https://app.example.com",
    "postLogoutRedirectUri": "https://app.example.com"
  }
}
```

Replace the client and API scope with those seeded by your backend. Do not add a client secret to a browser application. The file is public. The Vite development proxy is absent from this production build.

## Serve routes and assets correctly

Use this server configuration behind your HTTPS ingress, adjusting its document root, hostname and MIME file to your installation:

<<< ../examples/deployment/root.nginx

`/assets/` and file extensions use `try_files ... =404`. A missing script, image or JSON file therefore returns 404 rather than the SPA HTML. Only application paths fall back to index.html. Runtime configuration is not cached, HTML revalidates, and fingerprinted Vite assets can remain cached.

The server listens on 8080 because the example assumes a reverse proxy terminates HTTPS. If nginx terminates TLS itself, configure the HTTPS listener and certificate separately. Do not copy these example hostnames into your actual callback registration.

## Deploy under a subpath

For `https://app.example.com/portal/`, keep existing Vite plugins and add `base: '/portal/'` to `vite.config.ts`. In `src/main.ts`, use the same base for runtime configuration and router history:

```ts
import { loadRuntimeConfig } from '@lsw-abpvue/core';
import { provideAbpRouter, withRouterHistory } from '@lsw-abpvue/core/router';
import { createWebHistory } from 'vue-router';

const environment = await loadRuntimeConfig({
  url: `${import.meta.env.BASE_URL}dynamic-env.json`,
  defaults: defaultEnvironment,
});
const router = provideAbpRouter(routes, withRouterHistory(createWebHistory(import.meta.env.BASE_URL)));
```

Replace the generated runtime-config call and router provider with these, keeping the existing defaultEnvironment/routes imports and passing environment to Core. Do not construct a second router. Keep the generated development-only environment transformation when still using the same app locally.

Use the full frontend base in dynamic-env.json:

```json
{
  "production": true,
  "application": { "name": "BookStore", "baseUrl": "https://app.example.com/portal/" },
  "apis": { "default": { "url": "https://api.example.com" } },
  "oAuthConfig": {
    "issuer": "https://auth.example.com",
    "clientId": "BookStore_App",
    "scope": "offline_access BookStore",
    "responseType": "code",
    "redirectUri": "https://app.example.com/portal/",
    "postLogoutRedirectUri": "https://app.example.com/portal/"
  }
}
```

Copy the built output to `/srv/www/portal/` and use:

<<< ../examples/deployment/subpath.nginx

The filesystem and URL now share the portal directory. Local logo URLs and any configured silent-renew file must also use `/portal/`. Do not let another application's fallback handle the callback or runtime configuration.

## Synchronize backend configuration

Allow the frontend **origin** in CorsOrigins: `https://app.example.com`, without `/portal/`. Register the exact login and logout **URLs**, including `/portal/` and the intended trailing slash, for the OpenIddict client. RootUrl/RedirectAllowedUrls settings and seeded client redirect records have different purposes; inspect the actual seeded client rather than assuming one setting updates everything.

After changing seeded URLs, run the solution's DbMigrator. If the solution has a separate authorization server, update/start that host as well as the API. My account uses the local Account provider or the authorization server depending on provider order; verify the intended choice separately from logout.

## Verify the deployed result

| Request or action | Expected result |
| --- | --- |
| Direct `/identity/users`, or `/portal/identity/users` | SPA loads with the correct asset base |
| Runtime JSON | JSON body with deployed addresses, not HTML |
| Missing `/assets/not-found.js`, or its portal equivalent | 404, not index.html |
| Sign in | Authorization server returns to the registered frontend URL |
| Refresh after sign in | Session and granted policies are restored |
| My account / Logout | Correct destination and logout return |
| Filter, save and reopen a record | API contract and validation remain compatible |

A successful frontend build cannot prove CORS or callback registration. Inspect browser requests at each stage rather than editing several environment values at once.

## Promote and roll back

Build once, deploy that static output and supply environment-specific dynamic-env.json. Keep its API scopes and client contract compatible with the backend. Build-time `.env` variables do not replace the deployed file.

For a rollback, restore compatible assets, runtime configuration and backend contracts together. Reverting only JSON cannot repair an incompatible DTO. See [configuration](/guide/configuration), [authentication](/guide/authentication) and [troubleshooting](/guide/troubleshooting).
