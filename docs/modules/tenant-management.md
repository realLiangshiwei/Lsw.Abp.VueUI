# Tenant management

Tenant CRUD, feature management and tenant connection strings.

## Install and register

```bash
pnpm add @lsw-abpvue/tenant-management@alpha
```

```ts
import { provideTenantManagementConfig } from '@lsw-abpvue/tenant-management/config';
import { lazyRoutes } from '@lsw-abpvue/core/router';

const moduleConfig = provideTenantManagementConfig();
const moduleRoute = lazyRoutes('/tenant-management', () =>
  import('@lsw-abpvue/tenant-management').then(module => module.createTenantManagementRoutes()),
);
```

Add `moduleConfig` to startup providers and `moduleRoute` to your routes. Keep the matching ABP backend module installed.

## Routes and keys

| Page | Route | Key |
| --- | --- | --- |
| Tenants | `/tenant-management/tenants` | `TenantManagement.TenantsComponent` |

## Permissions and configuration

Page access requires `AbpTenantManagement.Tenants`; actions use Create, Update, Delete, ManageFeatures and ManageConnectionStrings policies under that prefix. Management is a host capability; it is separate from selecting a tenant for login.

## Behavior and customization

Feature management opens the shared dialog with provider `T` and the tenant id. Connection strings can use the shared database or a tenant-specific database. The tenant page supports the five contributor maps and `TenantManagement.Tenant` object extensions. [Page extensions](/concepts/extensions) describes the options; [feature management](./feature-management) describes the dialog.

Services and DTOs are in `@lsw-abpvue/tenant-management/proxy`. Startup configuration is imported from the package's `/config` entry; pass page contributors to its route factory.
