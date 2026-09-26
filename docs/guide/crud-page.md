# A CRUD page

Your own entities are not npm packages — they are your domain model. `abpv generate`
writes their pages.

```bash
abpv proxy add --module app       # the typed service the page is built on
abpv generate Book
```

Three things land:

```
src/pages/BooksPage.vue          the list, the dialog and the four requests
src/pages/books.extensions.ts    the columns, the form fields and the buttons
src/routes.ts                    one entry, wrapped in abpv:begin markers
```

## What is generated

```vue
<script setup lang="ts">
import {
  AbpExtensibleTable, AbpPage, AbpPageToolbar, AbpRecordModal, useRecordEditor,
} from '@lsw-abpvue/components';
import { inject as injectAbp, useListService } from '@lsw-abpvue/core';
import { BookService } from '../proxy/acme/book-store/books';
import type { BookDto, CreateUpdateBookDto } from '../proxy/acme/book-store/books';
import { BOOKS, BOOKS_PAGE, registerBooksExtensions } from './books.extensions';

const bookService = injectAbp(BookService);

const list = useListService({ persistKey: BOOKS });
const { items } = list.hookToQuery(query => bookService.getList(query));

registerBooksExtensions();

const editor = useRecordEditor<BookDto>({
  identifier: BOOKS,
  reload: () => list.get(),
  create: body => bookService.create(body as unknown as CreateUpdateBookDto),
  update: (id, body) => bookService.update(id, body as unknown as CreateUpdateBookDto),
  delete: id => bookService.delete(id),
  idOf: record => record.id,
  nameOf: record => String(record.name ?? ''),
  deletionMessage: 'BookStore::BookDeletionConfirmationMessage',
  providers: [/* what the row and toolbar buttons call */],
});
</script>

<template>
  <AbpPage title="BookStore::Menu:Books">
    <template #toolbar><AbpPageToolbar :data="items" /></template>
    <AbpExtensibleTable :data="items" :list="list" record-key="id" caption="BookStore::Menu:Books" />
    <AbpRecordModal :editor="editor" label="BookStore::Menu:Books" create-title="BookStore::NewBook" />
  </AbpPage>
</template>
```

Sixty-six lines, against the 438 of the React template's hand-written `BooksPage.tsx`. The
difference is not cleverness in the generator — paging, sorting, validation, the
permission checks on every button, the deletion question, the toasts and the server-side
validation errors all belong to `AbpExtensibleTable`, `AbpExtensibleForm` and
`useRecordEditor`. What is generated is a description of the entity.

## What it reads

Everything comes from `api-definition`, by HTTP shape rather than by method name — a
service that renamed `GetListAsync` is still the one that lists:

| The backend | The page |
| --- | --- |
| GET with no route parameter returning `PagedResultDto<T>` | The list; `T` is the record type |
| GET with `{id}` | Re-read the whole record before editing it |
| The body of POST | The form fields |
| The body of PUT with `{id}` | The update DTO |
| The record's properties, inherited ones included | The columns |
| `[Required]`, `[StringLength]`, `[Range]`, `[RegularExpression]` | The validators |
| The controller's `[Authorize]` | The permission on each button |
| A `filter` on the list endpoint | A search box |

A `DateTime` becomes a date control even though ABP reports its simple type as `string`,
and an enum becomes a select whose members are localized under ABP's own
`Enum:{Type}.{value}` convention. `id`, `extraProperties`, `concurrencyStamp` and the six
audit fields are left out: the first two are the framework's, the stamp is carried back
for you, and nobody wants to fill in `creationTime` on a create form.

## Changing what it shows

The extensions file is the one to edit. A column removed there is a column gone:

```ts
// abpv:begin props
export const BOOK_ENTITY_PROPS = EntityProp.createMany<BookDto>([
  { type: PropType.String, name: 'name', displayName: 'BookStore::Name', sortable: true },
  { type: PropType.Date, name: 'publishDate', displayName: 'BookStore::PublishDate', sortable: true },
]);
// abpv:end props
```

Three things follow from the page being a contributor to the extension system rather than
a page that bypasses it:

1. You change a column by editing your own source.
2. The backend adding an `ObjectExtensions` property puts a column and a field on the page
   **with no regeneration** — it arrives in `application-configuration` at runtime.
3. Another package can add a button to your page through the same contributor API every
   ABP module page accepts.

## Regenerating

```bash
abpv generate Book --force
```

Without `--force` a file that is already there is left alone. With it, only what is
inside the `abpv:begin` markers is rewritten — a helper you added below them, or an extra
column outside them, survives. The page file itself is rewritten whole, because its
structure is not the part you were meant to edit.

Running it twice changes nothing the second time, markers and route included.

## The options

| | |
| --- | --- |
| `--module <name>` | Which `api-definition` module to look in; all of them otherwise |
| `--policy <name>` | The base permission. `.Create`, `.Update` and `.Delete` follow from it |
| `--route` / `--menu` / `--icon` | Override what is inferred |
| `--resource <name>` | The localization resource; the backend's default resource otherwise |
| `--extension-module <m>` | Where the backend files the object extensions, as `Module` or `Module.Entity` |
| `--target` / `--proxy` / `--routes` | Where the files are |
| `--no-router` | Do not touch the routes file |
| `--dry-run` | Say what would change and write nothing |

Entity names work in either number: `abpv generate Books` finds the `Book` controller.
