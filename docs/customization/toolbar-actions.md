# Page toolbar extensions

Toolbar contributors add actions above a module's table. This example reports how many users are in the current page.

## Define the contributor

<<< ../examples/user-toolbar.ts

## Register with the module routes

Copy the example into `src/identity-options.ts` and use its exported options in `src/routes.ts`:

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { userToolbar } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(userToolbar)),
);
~~~

Add `identityRoute` to the application's route array and keep `provideIdentityConfig()` in startup. Replace the existing identity route rather than registering two routes for the same prefix. Restart the development server when changing module setup, then open `/identity/users`.


## Page records and selected records

The Identity users toolbar is typed as `ToolbarAction<readonly IdentityUserDto[]>`. `data.record` contains the current page. It is not the selection and it is not the full result set across all pages.

A bulk action over selected ids requires selection state owned by the page. Either contribute a component that reads a page-owned command/state token, or replace/wrap the page to supply that state. Do not use the current-page array as a substitute for selected ids.

## Trigger a modal or page command

In an action callback, resolve the page command token through `data.getInjected`. Commands should own visible, dirty and busy state, so the action remains a trigger. A reusable custom toolbar component can render a richer control; an entirely new UI may use the table's toolbar slot in a replacement page.

Use `ToolbarAction` for text/icon/callback actions. Put custom rendered controls in a Vue toolbar slot or page component.

## Permission and async behavior

Set `permission` to the policy required by the action. Use `visible` for additional reactive business conditions. A Promise returned by the action is allowed, but explicit command state must protect repeated mutations and refresh the query when complete.

The example count uses a localization key with a fallback. Add `BookStore::CurrentPageCount` and `BookStore::CurrentPageCountMessage` texts to the backend resource or frontend [localizations](/concepts/localization).

## Verify

Change the page size and page number, then click the action: the count should follow the visible page. A user without the required policy should not see it. For your own bulk action, separately test zero selection and selection across page changes.

See [extension behavior](/customization/extension-behavior) and [replacement](/customization/replacement).


## Call an application service

Install ReportAppService from [the backend examples](/tutorials/backend-examples). GET `/api/app/report?year=2026` returns `{ total: number }` and requires `AbpIdentity.Users` in this walkthrough. Copy both files, pass reportToolbar to the existing Identity route options, and add BookStore::Report/ReportTotal texts. The service owns a repeated-request guard; the contributor triggers it through getInjected. This counts sample catalogue records for the selected year and current tenant, not selected Users rows.

<<< ../examples/report-service.ts

<<< ../examples/report-toolbar.ts
