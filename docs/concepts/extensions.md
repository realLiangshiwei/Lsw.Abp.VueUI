# The extension system

Five extension points, ABP's own component keys, and contributor callbacks with the same
shape as the Angular UI's — so a configuration written against `@abp/ng.*` moves over
unchanged.

| Point | What it decides |
| --- | --- |
| `entityProps` | The table's columns |
| `createFormProps` | The fields of the create dialog |
| `editFormProps` | The fields of the edit dialog |
| `entityActions` | The buttons on a row |
| `toolbarActions` | The buttons above the table |

## Adding a column without touching the module

```ts
import { EntityProp, PropType } from '@lsw-abpvue/components';
import { IdentityComponents } from '@lsw-abpvue/identity';

createIdentityRoutes({
  entityPropContributors: {
    [IdentityComponents.Users]: [
      props =>
        props.addByIndex(
          EntityProp.create({
            type: PropType.String,
            name: 'employeeNumber',
            displayName: 'BookStore::EmployeeNumber',
            sortable: true,
          }),
          2,
        ),
    ],
  },
});
```

The list is a linked list with the API the Angular UI's has: `addHead`, `addTail`,
`addByIndex`, `addBefore`, `addAfter` and their `addMany` forms, plus `dropHead`,
`dropTail`, `dropByIndex` and `dropByValue`. A contributor is a plain function handed the
list; what it does to it is up to it.

## The order things are assembled in

Priority, lowest first:

1. **The module's defaults** — what `@lsw-abpvue/identity` puts on its own page.
2. **The backend's object extensions** — every property `ObjectExtensions` declares
   arrives in `application-configuration` and becomes a column and a field, with the
   validators its attributes stand for. No frontend code at all.
3. **The application's contributors** — yours, so you can drop or reorder what the first
   two produced.

Assembly happens in a route resolver, before the page renders, and it is idempotent: a
second navigation replaces the contributors rather than adding a second copy of every
column.

## Reading a value

```ts
EntityProp.create<BookDto>({
  type: PropType.Enum,
  name: 'type',
  displayName: 'BookStore::Type',
  valueResolver: data => data.getInjected(LocalizationService).t(`BookStore::Enum:BookType.${data.record.type}`),
});
```

`data.getInjected` is the way out of a callback and back into the injector — a
contributor is a plain function, so it is outside every injection context.

A resolver returns text, and the cell renders it as an interpolation. There is no
`innerHTML` here: the Angular UI's `valueResolver` returns an HTML string, and a column
built from user data is not somewhere to put one. Anything richer than text names a
`component` instead, which receives `record`, `index`, `prop` and `value`.

## Buttons

```ts
EntityAction.create<BookDto>({
  text: 'BookStore::Reprint',
  icon: 'bi bi-printer',
  permission: 'BookStore.Books.Reprint',
  visible: data => data.record.type !== BookType.Undefined,
  action: data => data.getInjected(BOOKS_PAGE).reprint(data.record),
});
```

`permission` is checked against `grantedPolicies`, `visible` against the record. A row
with no visible action shows no menu at all rather than an empty one.

## When a contributor does nothing

```js
__abpvue.inspect();                            // a table per extension point
__abpvue.dump('Identity.UsersComponent');      // the same, as data
```

Every entry says where it came from (`default`, `object-extension`, `contributor`), who
added a second one under the same name, and which policy or predicate is keeping it off
the screen — plus the contributors registered under a key no module declares, which is
what a misspelled component key looks like from the inside.

Development only. A production build does not contain it.

## Component keys

```ts
IdentityComponents.Users === 'Identity.UsersComponent';
```

Verbatim ABP's, which is the point: the keys, the contributor signatures and the
localization keys are all the ones an Angular application already uses.
