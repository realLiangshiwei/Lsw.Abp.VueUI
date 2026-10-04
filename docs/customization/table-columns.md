# Table column extensions

This example replaces the users table's email text with a mail link. The host must have the Identity UI registered and permission to open the users page.

## Define the cell

Create `src/components/ContactCell.vue`:

<<< ../examples/ContactCell.vue

The component receives the row as a prop. It can also declare `index`, `prop` and `value` when needed. Render a text interpolation or a Vue component; `valueResolver` does not insert HTML.

## Define the contributor

Save this example as `src/identity-options.ts`. Adjust the ContactCell import to `./components/ContactCell.vue`:

<<< ../examples/user-columns.ts

## Register with the module routes

Copy the example into `src/identity-options.ts` and use its exported options in `src/routes.ts`:

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { userColumns } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(userColumns)),
);
~~~

Add `identityRoute` to the application's route array and keep `provideIdentityConfig()` in startup. Replace the existing identity route rather than registering two routes for the same prefix. Restart the development server when changing module setup, then open `/identity/users`.


## Choose column behavior

| Field | Meaning |
| --- | --- |
| `name` | Stable field identity and default value path |
| `displayName` | Localization key for the header |
| `sortable` | Default false; sends the column name to the backend |
| `columnWidth` | Optional width |
| `columnVisible` | Checks whether the whole column exists |
| `visible` | Checks whether a row's value is visible |
| `isExtra` | Reads `record.extraProperties[name]` |
| `component` | Replaces the cell rendering |

The derived `contact` column is deliberately not sortable: the backend has no `contact` sorting field. To retain email sorting, use `name: 'email', sortable: true` instead.

For a derived text field use `valueResolver: data => data.record.name || data.record.userName || ''`. Keep asynchronous lookups cached or preload a map; one request for every cell can create excessive traffic.

## Verify

The email column is removed, a contact link appears after username, and records without an email show a dash. Navigate away and back to confirm there is only one contact column. Check layout at narrow widths and with a different language.

[Extension defaults](/customization/extension-behavior) and [list operations](/customization/extension-behavior#list-operations) explain visibility, ordering and fallback behavior.

## Choose the value or component path

For a derived plain value, return it from valueResolver and keep the cell escaped. For a rich link, use component as in ContactCell.vue. The cell component receives its record, prop, index and value; it can resolve services through the row's injector. Keep asynchronous enrichment cancellable and avoid making one request per render.

A value resolver can return a value, Promise, Ref or getter. A backend endpoint may reject or be too slow; prefer including commonly displayed values in the list DTO to avoid an N+1 query pattern. A component is appropriate for a badge/link, not a reason to embed unsanitized HTML.

## Visibility, width and sorting

`permission` controls whether the column is allowed. `columnVisible(getInjected)` controls the entire column; per-record visible controls individual values. User hiddenColumns is another filter. A column can therefore be absent even when its contributor ran correctly.

Set columnWidth for a useful width hint. A derived field should be sortable only if the backend accepts its name as a sorting field. Renaming the display label does not rename the API sort property. A `cell-{name}` slot is a local renderer override; a host component contributor applies consistently wherever that module registry is used.

## Reorder a default

Find the default by its stable name, remove it, and insert the same prop at the intended position. This preserves its resolver, permission and type rather than recreating an incomplete substitute. Check whether your anchor exists before inserting. Compare the final list for duplicates and test both denied permissions and a user-hidden column.
