# What this is

A Vue 3 UI for the [ABP Framework](https://abp.io), covering what the official Angular UI
covers: the six open source module UIs, the theme layer, authentication, multi-tenancy,
the extension system, the proxy generator and a CLI.

It is **unofficial** and not affiliated with Volosoft. MIT licensed.

## What it asks of your backend

Nothing. It reads four framework endpoints:

| | |
| --- | --- |
| `/api/abp/application-configuration` | Current user, permissions, settings, features, localization, object extensions |
| `/api/abp/application-localization` | The texts, per culture |
| `/api/abp/api-definition` | What the proxy generator reads |
| `/api/abp/multi-tenancy/tenants/by-name/{name}` | Resolving a tenant from the host name |

plus each module's own endpoints. Those are the same ones the Angular UI reads, and they
are in the framework already. There is no server-side package to install.

The one thing a backend does need is to allow your frontend's origin, which `abpv new`
and `abpv switch-ui` write for you.

## What it is built on

| | |
| --- | --- |
| Vue | 3.5, `<script setup>` and the Composition API throughout |
| Router | `vue-router` 4 |
| Authentication | `oidc-client-ts` for the authorization code flow |
| Tables | `@tanstack/vue-table` |
| Theme | `theme-basic`: reka-ui with Bootstrap 5's stylesheet |
| Build | Vite, ESM only |

No RxJS, no Pinia, no state library. Application state is `ComputedRef`, requests return
promises. Dependency injection is a kernel of its own — Vue's `provide`/`inject` with
hierarchical resolution, multi-providers and typed tokens — because the extension system
needs an injector that callbacks outside a component can reach.

## What it does not do

| | |
| --- | --- |
| Commercial module UIs | Those need a licence and are not in the community scope |
| Server-side rendering | The platform is abstracted for it; a Nuxt adapter is after 1.0 |
| Backend code generation | `abpv generate` writes pages, not entities. ABP Suite writes entities |
| Angular's `ng update` code mods | `abpv update` moves versions and runs migrations; it does not rewrite your calls |

## Where to go next

- [A new solution](./new-solution) — one command, backend and frontend
- [An existing solution](./existing-solution) — adding a Vue UI to what you have
- [Coming from Angular](../migration/from-angular) — what is the same, what is not
