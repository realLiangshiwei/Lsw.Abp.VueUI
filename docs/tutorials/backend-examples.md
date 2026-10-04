# Run the backend examples

Several guides need endpoints beyond the framework APIs. This page supplies that backend code so you can run the catalogue list, extensible module, printing settings and report examples in an existing ABP solution.

## Prepare the solution

Start with [a new solution](/guide/new-solution) or [an existing solution](/guide/existing-solution) containing Identity and Setting Management. Use the generated single-host development solution for the first run. Its application module should already depend on the corresponding ABP application modules, and its HTTP host should already create conventional controllers for that application assembly.

The sample endpoints require `AbpIdentity.Users`, reusing an existing policy to avoid a permission-definition setup step. Sign in as the development admin. For a real feature, define its own policy and check it on the server and in the UI. The catalogue is shared by authorized users within a tenant; printing settings belong to the current user.

## Add the catalogue service

Create `aspnet-core/src/<Project>.Application/DocumentationSamples/DocumentationCatalogAppService.cs`:

<<< ../examples/backend/DocumentationCatalogAppService.cs

The namespace can remain `DocumentationSamples`: it does not depend on a project-specific base class. Automatic dependency registration creates the singleton store, and conventional controllers expose `/api/app/documentation-catalog` with list, detail, create, update and delete methods.

This is deliberately a small **in-memory teaching catalogue**. It starts empty and loses data when the host restarts. Tenant stores are separate. It has no database transaction, concurrency stamp or durable repository. Replace the store with your domain repository and DTO mapping when implementing a production entity; do not treat this sample as persistent storage.

The list filters before computing the total, accepts name/price sorting, adds a stable id tie-breaker, and then applies paging. Input annotations provide real server validation. The optional `minPrice` is omitted when no value is selected.

## Add persisted printing settings

Create `DocumentationSamples/PrintingSettingsAppService.cs` in the same Application project:

<<< ../examples/backend/PrintingSettingsAppService.cs

The definition is discovered from the module assembly. GET and PUT `/api/app/printing-settings` use ABP's `ISettingManager`, current user id and existing setting-store integration. The default is 1; values 1–20 are accepted. Unlike the teaching catalogue, these overrides use the solution's configured persistent setting store.

The visible setting appears as `Documentation.Printing.DefaultCopies` after configuration refresh. `POST /api/app/printing-settings/reset` removes the user's override and restores inherited/default behavior. No caller-supplied user id is accepted.

## Add the report endpoint

Create `DocumentationSamples/ReportAppService.cs`:

<<< ../examples/backend/ReportAppService.cs

GET `/api/app/report?year=2026` counts catalogue records created in that year for the current tenant. New records use the current UTC year. This report uses server data, not the Users table's selected rows. Restarting the host resets the catalogue and therefore its report total.

## Start and inspect

Rebuild and restart the HTTP host. If conventional controllers are configured in a separate HTTP API project, keep the application's existing `ConventionalControllers.Create(typeof(<Project>ApplicationModule).Assembly)` registration; these classes must be in that selected assembly. No Vue-specific backend package is required.

Open Swagger and confirm the three route families. If they are absent, check the assembly used for controller creation and the application module's dependency registration before debugging the frontend. A 403 means the signed-in user lacks the sample policy, not that the route was not generated.

## Add the frontend route

Create `src/pages/CataloguePage.vue` from [the list guide](/utilities/lists). Add this record to the existing `src/routes.ts` array:

```ts
{
  path: '/catalogue',
  component: () => import('./pages/CataloguePage.vue'),
  meta: {
    title: 'BookStore::Books',
    requiredPolicy: 'AbpIdentity.Users',
    routes: { name: 'BookStore::Books', order: 3, iconClass: 'bi bi-book' },
  },
}
```

Add `BookStore::Books` to the localization resource. Keep the generated startup, router and theme providers. The backend URL and authentication client remain those of your solution.

For [module component examples](/components/extensible-table), point `CatalogModulePage.vue` to the same catalogue endpoint; the published example already does so. Name-only requests use the backend's category/price defaults. For [printing/profile tabs](/customization/profile-settings), keep the Account and Setting Management providers and routes; the custom tab uses the same sample policy. [Report toolbar](/customization/toolbar-actions) uses the supplied report service.

## Generate and inspect a proxy

From `vue/`, run against the started backend:

```bash
pnpm abpv proxy add --module app --dry-run
pnpm abpv proxy add --module app
```

Use `--insecure` only when Node does not trust the local development certificate. Check the actual names in `src/proxy/generate-proxy.json` and the generated namespace indexes. The documentation snippets using RestService intentionally do not depend on generated import paths; [the proxy guide](/guide/backend) shows consuming typed services, enums and validators.

## Verify real requests

Create six records with distinct names, categories and prices. Combine filters, sort by price, change page size and open a second page. Edit one record and confirm GET detail returns its new values. Delete the last row on a later page and confirm the UI returns to a valid page. Submit an empty name or negative price and confirm a validation response leaves the editor open.

Change Copies to 3, save, leave and reopen the tab: GET should still return 3. Send 0 directly in Swagger: server validation must reject it regardless of the frontend range control. Reset the override when finished. Check the report total before/after creating a record and check that a signed-out request is rejected.

The remote user lookup example uses the Identity users API (`AbpIdentity.Users`) rather than these teaching endpoints. Object extension persistence is covered separately in [object extensions](/customization/object-extensions); the in-memory catalogue does not exercise that mapping.

Delete only records you created for this walkthrough. Remove these sample files when you no longer want their endpoints in the application.
