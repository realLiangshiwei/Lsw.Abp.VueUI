# Build a business page

This walkthrough uses the optional BookStore backend sample. It assumes the backend is running, its database has been seeded, and the signed-in user has the Books policies.

## 1. Create the sample

```bash
npx @lsw-abpvue/cli@alpha new Acme.BookStore -d mongodb --sample-crud
```

Follow [Quick Start](/guide/new-solution) to start the backend. The sample option includes the Books page. To generate a page for a service added later, run from `vue/`:

```bash
pnpm abpv proxy add --module app --insecure
pnpm abpv generate Book --insecure
```

`--insecure` is for an untrusted local development certificate. Generated proxies and pages use the backend's actual DTO and method names.

## 2. Read the generated page

Open `src/pages/BooksPage.vue`. The template comes first; the script declares `columns`, `rowActions`, the list, form and request methods. Common APIs use automatic imports, while business DTOs and services use explicit imports.

The page has no extension registration or `useRecordEditor`. Change its columns and fields directly. Use table cell slots for custom displays, such as replacing an author id with a lookup label.

## 3. Follow the data flow

`useListService` builds paging and sorting input. Its fetcher calls the generated service and forwards cancellation. Create resets the form; Edit loads the latest record before patching it. Save validates and calls Create or Update. Successful save closes the modal and reloads the list; validation failure preserves the form.

Delete asks for confirmation first. `AbpGridActions` displays several visible actions as a dropdown, one as a button, and none as an empty cell.

## 4. Adapt it

Add business validation, lookup controls, columns and action policies in this file. Preserve concurrency stamps and extra properties when updating. Show the localized record range beside pagination. Bind modal dirty and busy states, and use footer `close()` for Cancel.

The [list example](/utilities/lists) and [form example](/utilities/forms) show the underlying APIs independently. `generate --force` replaces the whole page, so save custom changes before regenerating.
