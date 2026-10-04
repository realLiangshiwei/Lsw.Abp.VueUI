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

## Pick host or tenant before login

Use the account tenant box for an interactive login workflow. It coordinates lookup, token invalidation, configuration refresh and authentication navigation. A custom picker needs to do that same coordination; setTenantByName by itself updates session selection, not the current user's permissions.

An empty host choice should clear the selected session tenant, refresh anonymous configuration and authenticate in host context as needed. A query-string tenant is an id lookup, not a display-name lookup. When domainTenant is set, keep the picker hidden and do not offer a contradictory tenant switch.

## Domain configuration

A frontend base URL such as https://{0}.example.com resolves acme from https://acme.example.com. Matching API/issuer/redirect placeholders are substituted during URL tenant resolution. DNS and HTTPS certificates must cover the real hosts; string substitution does not create them. Configure registered callbacks and backend tenant resolvers for the same deployment.

The current implementation substitutes specific environment fields; do not assume every arbitrary custom URL or logout URL is rewritten. Inspect the effective environment and deliberately configure any additional tenant-specific addresses.

## Separate selection from management

The tenant-management page creates tenant records; the picker chooses which tenant the session uses. Creating a tenant does not initialize every business module's data automatically. Tenant-scoped settings/features/policies can differ from host values, so after switching verify currentTenant, grantedPolicies and effective settings from the fresh configuration.

## Troubleshooting a tenant request

Inspect __tenant on the failing request, the selected session id, any tenant claim on the token and the backend resolver order. A token for tenant A cannot be reused just by attaching tenant B's header. Unknown domain tenancy stops startup; it must not silently expose host context. See [authentication](/guide/authentication) and [current state](/concepts/state).
