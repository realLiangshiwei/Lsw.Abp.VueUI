# Build and customize a business page

This walkthrough creates the optional BookStore sample, then changes price display and validation. It uses ordinary Vue page code rather than module contributors.

## 1. Create the solution

~~~bash
npx @lsw-abpvue/cli new Acme.BookStore -d mongodb --sample-crud
~~~

Start and initialize the backend following [Quick Start](/guide/new-solution). Start the frontend from `vue/` and log in with an account granted the sample's Books permissions. The optional sample includes Authors and Books endpoints; a default solution does not include these entities.

Open `/books` and confirm records load before editing the page. If the page is absent, check whether the solution was created with `--sample-crud`.

## 2. Locate the page and its responsibilities

Open `vue/src/pages/BooksPage.vue`. The template is first, followed by the setup script.

| Part | Responsibility |
| --- | --- |
| `columns` | Header, sorting fields and cell rendering |
| `rowActions` | Explicit record callbacks filtered by policy |
| `list` / query function | Paging, sorting, loading and query execution |
| `form` / `buildForm` | Validators and initial create/edit values |
| `createBook` / `editBook` | Load author choices and open the modal |
| `save` | Validate, POST/PUT, close on success and reload |
| `deleteBook` | Confirm, DELETE and reload |

For additional backend entities, generate the proxy and page from `vue/`:

~~~bash
pnpm abpv proxy add --module app --insecure
pnpm abpv generate Book --insecure
~~~

Use `--insecure` only for untrusted local certificates. `generate` keeps existing pages; do not expect this command to overwrite the sample. Generated services/DTOs reflect your actual backend, so names and fields can differ from the optional sample.

## 3. Format the price

Create `src/components/PriceCell.vue`:

<<< ../examples/PriceCell.vue

Import it explicitly in BooksPage's script:

~~~ts
import PriceCell from '../components/PriceCell.vue';
~~~

Add a cell slot inside the existing `AbpDataTable`:

~~~vue
<template #cell-price="{ row }">
  <PriceCell :price="row.price" currency="USD" />
</template>
~~~

The column id must remain `price` so the slot matches. Choose the currency your domain actually uses. The sample formats a number; it does not convert exchange rates. Changing language updates the numeric presentation.

## 4. Add a nonnegative price rule

Keep the existing field's type and initial value, and extend its validator array:

~~~ts
price: {
  value: null as number | null,
  validators: [Validators.required(), Validators.min(0)],
},
~~~

If your page uses explicit imports, import `Validators` from `@lsw-abpvue/theme-shared`. Generated application auto-imports may already provide it. The field must still render its errors through the page's `errorsOf('price')` function.

This only adds frontend feedback. The backend's price validation remains required. Avoid adding a frontend field without extending the request DTO and backend when persistence is intended.

## 5. Preserve the save workflow

The modal binds `dirty` to the form and `busy` to the save state. Cancel uses the footer's scoped `close()`; a successful save directly sets visibility false. A failed save retains form values.

Edit should fetch a fresh record before filling controls. When your backend DTO carries a concurrency stamp or extra properties, preserve them in the update body. A successful update refreshes the query; avoid an unconditional close in a finally block.

For a custom list query, forward its `AbortSignal` to RestService/generated service so obsolete requests can be canceled. [Lists](/utilities/lists) contains a complete typed example.

## 6. Walk through the result

1. Create a book with an author, type, date and valid price.
2. Try an empty and a negative price; verify field messages and no successful save.
3. Edit the record and confirm the formatted price.
4. Change a field and cancel; decline and accept the discard confirmation.
5. Check sorting, page size and localized record range.
6. Delete the test book through confirmation.
7. Repeat with a user lacking create/edit/delete policies.

Run `pnpm typecheck` and `pnpm build` before integrating. Preserve your changes before `generate --force`: that option replaces the whole page.

Next: [modal forms](/utilities/modals), [forms](/utilities/forms), [lists](/utilities/lists), or [reusable module extensions](/concepts/extensions).
