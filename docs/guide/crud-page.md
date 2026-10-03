# A CRUD page

`abpv generate` creates an ordinary Vue page for an entity exposed by your backend.
The page owns its table columns, form controls and CRUD methods, so you can edit them
in one place.

```bash
pnpm abpv proxy add --module app
pnpm abpv generate Book
```

Run these from the frontend directory with the backend running. If Node does not trust
a local development certificate, append `--insecure` to both commands. Generate before
starting `pnpm dev`, or restart the development server afterwards.

## What is generated

```text
src/pages/BooksPage.vue    the template, columns, form and CRUD methods
src/routes.ts            one route and menu entry
```

The page puts `<template>` before `<script setup lang="ts">`. It uses `AbpDataTable`
and `AbpPagination` for the list, explicit theme controls for each form field, and
`AbpModal` for the dialog. Common APIs use the application's automatic imports when
`abpVue.autoImports` is enabled; business services and DTOs keep explicit imports.

The page includes these application methods:

| Method       | Behavior                                                |
| ------------ | ------------------------------------------------------- |
| `createBook` | Clear the selection, reset the form and open the dialog |
| `editBook`   | Fetch the record, fill the form and open the dialog     |
| `save`       | Validate, create or update, then close and reload       |
| `deleteBook` | Ask for confirmation, delete and reload                 |

`useListService` handles query state and `useAbpForm` handles control values and validation.
There is no page token, extension registration function or adjacent `.extensions.ts` file.
Reusable module UIs continue to use the [extension system](../concepts/extensions.md).

## What it reads

| Backend description                            | Page                         |
| ---------------------------------------------- | ---------------------------- |
| GET returning `PagedResultDto<T>`              | List and record type         |
| GET with an id                                 | Re-read before editing       |
| POST body                                      | Form fields and create DTO   |
| PUT with an id                                 | Update request               |
| DTO properties, including inherited properties | Columns and controls         |
| Data annotations                               | Client validators            |
| Authorization policies                         | Route and action permissions |
| List filter parameter                          | Search box                   |

Dates use date controls, enums use localized selects, and boolean fields use checkboxes.
Unsupported nested objects and collections are reported for you to implement directly.
Write-only fields start with an empty value when editing. Existing record data, including
extra properties and concurrency stamps, is retained in update requests.

## Customizing the page

Edit the generated Vue file directly:

- Change `columns` or add a `#cell-{id}` slot to customize a cell.
- Add or reorder form controls in the template and their definitions in `useAbpForm`.
- Change the request body in `save` for your business rules.
- Add your own buttons and methods.

Validation messages appear beside their controls. Server validation errors are sent to
the form, and unmatched messages appear in the dialog. A failed save leaves the dialog
open. The modal receives `form.dirty` and the busy state; its Cancel action uses the
footer's `close()` so it can confirm before discarding changes.

Backend object extensions do not automatically add controls to an application page.
Add their controls and bindings explicitly. Module pages retain automatic object extension
mapping through their contributors.

## Regenerating

Existing pages are kept unless you pass `--force`:

```bash
pnpm abpv generate Book --force
```

**`--force` replaces the entire Vue page.** Save your custom changes before using it.
The route is not added twice. Legacy `.extensions.ts` files are left on disk and are no
longer imported by newly generated pages; review them before removing them yourself.

## Options

See the [generate reference](../cli/generate.md) for module selection, target directories,
localization resources, policies, route names and automatic import options.
