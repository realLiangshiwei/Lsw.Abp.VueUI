# Tenant management

Tenants, the features they are given and the connection strings they use.

```ts
provideTenantManagementConfig();

lazyRoutes('/tenant-management', () =>
  import('@lsw-abpvue/tenant-management').then(m => m.createTenantManagementRoutes()),
);
```

| Page | Route | Component key |
| --- | --- | --- |
| Tenants | `/tenant-management/tenants` | `TenantManagement.TenantsComponent` |

An extensible table with create, edit and delete, plus two row actions: the feature dialog
and the connection string.

## The connection string

```
Use shared database          the tenant has none of its own
Use a separate database      one connection string, saved with the tenant
```

The Angular UI has no screen for this at all — the endpoints are there and nothing calls
them. Here it is a small dialog behind a row action, gated on
`AbpTenantManagement.Tenants.ManageConnectionStrings`.

## Features

The same dialog the feature management module provides, opened with `provider-name="T"`
and the tenant's id. A feature that is disabled for a tenant cascades: its children go
with it, and the email settings tab disappears from that tenant's settings page.

## Object extensions

`ObjectExtensions` for `TenantManagement.Tenant` add columns and fields here, as
everywhere else.
