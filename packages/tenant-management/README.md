# @lsw-abpvue/tenant-management

Tenant management for [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an
**unofficial** Vue UI for the [ABP Framework](https://abp.io).

```bash
pnpm add @lsw-abpvue/tenant-management
```

Two entry points, loaded at different times:

```ts
// main.ts: the menu, at startup
import { provideTenantManagementConfig } from '@lsw-abpvue/tenant-management/config';

provideTenantManagementConfig();
```

```ts
// routes.ts: the page, on the first navigation into /tenant-management
import { lazyRoutes } from '@lsw-abpvue/core/router';

lazyRoutes('/tenant-management', () =>
  import('@lsw-abpvue/tenant-management').then(module => module.createTenantManagementRoutes()),
);
```

## What it is

`/tenant-management/tenants`, built on the extension system the same way the identity
pages are: the columns, the create and edit fields, the row buttons and the toolbar are
all contributors, and the module's own are registered first.

| | |
| --- | --- |
| Tenants | list, create with an administrator, edit, delete |
| Features | through `@lsw-abpvue/feature-management`, from a row button |
| Connection string | its own database, or the shared one, from a row button |

A new tenant is asked for an administrator's address and password; an existing one is
not, because by then it has users of its own. That is the whole of the difference between
the create and the edit form, and both are contributor lists a host can add to.

## The connection string

`AbpTenantManagement.Tenants.ManageConnectionStrings` opens a dialog with the two states
the backend has: the shared database, or one of this tenant's own. Ticking "use the
shared database" deletes the connection string rather than saving an empty one, which is
what the endpoint is for.

## Compared with the Angular UI

Same component key, same contributor tokens, same route and policy names, same
localization keys. What differs:

| Angular | Here |
| --- | --- |
| No connection string UI, though the endpoints, the permission and the localization keys are all in the open source module | A dialog behind the permission ABP defines for it |
| `AbpTenantManagement::Edit` / `Delete` / `AreYouSure`, which the backend has no key for | `AbpUi::Edit` / `Delete` / `AreYouSure`, which it does |
| The contributor record is typed against `TenantCreateDto` on one form and `TenantUpdateDto` on the other, and the page then casts | One `TenantDto` contributor type; the request body is assembled at save |
| A leftover handler focuses an element named `defaultConnectionString` that no template renders | Gone with the dialog that gives it something to focus |

Registered in the design documents' `api-parity-map.md`.

## Licence

MIT.
