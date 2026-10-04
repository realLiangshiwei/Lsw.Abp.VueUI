# Multi-tenancy

`MultiTenancyService` resolves the tenant and exposes it through `useMultiTenancy()`. Framework requests use the tenant id in the `__tenant` header by default.

## Resolution order

1. A `{0}` placeholder in `application.baseUrl`, resolved from the browser URL.
2. The `__tenant` query parameter, when no domain tenant was found.
3. The tenant stored in the session, when neither URL source is present.

For domain tenancy, matching placeholders in API and authentication addresses are substituted before requests. A domain tenant pins the session, so the tenant picker is hidden. An unresolved domain tenant raises `TenantNotFoundError`; it does not continue in host mode.

## Reading and choosing a tenant

```ts
import { useMultiTenancy } from '@lsw-abpvue/core';

const tenancy = useMultiTenancy();
const currentTenant = tenancy.currentTenant;
const domainTenant = tenancy.domainTenant;
const tenant = await tenancy.setTenantByName('acme');
```

The lookup returns the resolved tenant or `null`. `setTenantById` supports an id lookup. These methods change tenant selection; they do not sign the user into that tenant. The authentication package invalidates a token issued for a different tenant. Reload configuration and authenticate as needed, or use the account tenant box which coordinates that flow.

## Backend setup

Enable ABP multi-tenancy and provide the tenant resolution endpoints. Tenant switching and tenant administration are different features: the picker selects a session tenant; the management module creates tenants and edits their configuration.
