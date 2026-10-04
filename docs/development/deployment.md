# Deploying an application

Build the Vue frontend as a static application and serve its output from your web host. The ABP backend and authentication server remain separate services.

## Runtime configuration

Set the production API, issuer and frontend addresses in `public/dynamic-env.json` before deployment, or replace the deployed file. Set `production: true` and use `responseType: 'code'` for the authorization code flow.

The Vite development proxy is not part of a production build. Configure real reachable service URLs. [Configuration](/guide/configuration) describes named APIs and endpoint overrides.

## Web host and backend

| Requirement | Reason |
| --- | --- |
| Serve frontend routes through `index.html` | Direct navigation to `/identity/users` must load the SPA |
| Serve `dynamic-env.json` as JSON | An HTML fallback cannot provide environment values |
| Register exact login and logout callback URLs | OpenIddict validates them |
| Allow the frontend origin in backend CORS | Browser requests must reach the APIs |
| Re-run DbMigrator after changing seeded client URLs | Editing configuration does not update an existing database client |

A host serving under a subpath must use matching Vite base and router history settings, runtime configuration location and callback addresses. Test direct links and authentication returns at that path.

## Before exposing it

Check login, refresh, My account, logout, permissions, tenant behavior and direct links against the deployed configuration. The code-flow My account page is normally on the authentication server, so that server must also be accessible to the browser.

Do not place secrets in frontend environment files; they are publicly readable.
