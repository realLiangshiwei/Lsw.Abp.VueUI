# @lsw-abpvue/components

The extension system of [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an
**unofficial** Vue UI for the [ABP Framework](https://abp.io). It is what makes a module's
pages extensible without forking them: a host adds a column, a field, a row button or a
toolbar button by registering a contributor, and the module's code does not change.

```bash
pnpm add @lsw-abpvue/components
```

Also importable as `@lsw-abpvue/components/extensible`, the path an Angular application
knows it by.

## A page

```vue
<script setup lang="ts">
import { AbpExtensibleTable, AbpPage, AbpPageToolbar, EXTENSIONS_IDENTIFIER } from '@lsw-abpvue/components';
import { inject, provideAbp, useListService } from '@lsw-abpvue/core';
import { BookService } from './proxy';

const books = inject(BookService);
const list = useListService({ persistKey: 'BookStore.Books' });
const { items } = list.hookToQuery(query => books.getList(query));

provideAbp([{ provide: EXTENSIONS_IDENTIFIER, useValue: 'BookStore.BooksComponent' }]);
</script>

<template>
  <AbpPage title="BookStore::Books">
    <template #toolbar><AbpPageToolbar :data="items" /></template>
    <AbpExtensibleTable :data="items" :list="list" record-key="id" />
  </AbpPage>
</template>
```

The columns, the row buttons and the toolbar all come from the extension points under
that component key. Nothing above names a column.

## The five extension points

```ts
const extensions = inject(ExtensionsService);

extensions.entityProps; // table columns
extensions.createFormProps; // fields of the create form
extensions.editFormProps; // fields of the edit form
extensions.entityActions; // buttons on a row
extensions.toolbarActions; // buttons above the table
```

A module assembles its own defaults, the backend's object extensions and the
application's contributors, in that order:

```ts
mergeWithDefaultProps(
  extensions.entityProps,
  DEFAULT_BOOKS_ENTITY_PROPS, // the module's own
  objectExtensionContributors.prop, // what the backend's ObjectExtensions add
  hostContributors, // what the application registered
);
```

Later contributors see what the earlier ones built, so they can insert, drop or reorder:

```ts
export function addIsbnColumn(propList: EntityPropList<BookDto>) {
  propList
    .add(EntityProp.create({ type: PropType.String, name: 'isbn' }))
    .after('name', (prop, name) => prop.name === name);
}
```

Assembling again replaces the result rather than adding a second copy of every column, so
a repeated navigation is harmless.

## What the backend adds by itself

A property added to an entity in C# arrives in the application configuration, and
`mapEntitiesToContributors` turns it into a column and a form field with its type, its
options, its validators and its label — nothing is written for it here:

```csharp
user.AddOrUpdateProperty<string>("SocialSecurityNumber", property => {
    property.UI.OnTable.IsVisible = true;
    property.Attributes.Add(new RequiredAttribute());
});
```

Enums become a select and a localized cell, a `ui.lookup` becomes a typeahead over the
endpoint it names, and a property whose `policy` the user does not satisfy is not
generated at all.

## Forms

The page owns the form, because the page is what submits it:

```ts
const book = useExtensibleForm<BookDto>(selected.value);

async function save() {
  if (!book.form.validate()) return;
  await books.create(book.toRequestBody()); // extra properties nested back where ABP wants them
}
```

```vue
<AbpExtensibleForm :form="book" :record="selected">
  <template #field-authorId="{ control }">…</template>
</AbpExtensibleForm>
```

Fourteen property types reach six contract components from `@lsw-abpvue/theme-shared`.
Swapping the control for a type needs no map of its own: `THEME_COMPONENTS` already
overrides a contract for a subtree.

## When a contributor does nothing

```js
__abpvue.inspect(); // a table per extension point
__abpvue.dump('Identity.UsersComponent'); // the same, as data
```

Every entry says where it came from (`default`, `object-extension`, `contributor`), who
added a second one under the same name, and which policy or predicate is keeping it off
the screen — plus the contributors registered under a key no module declares, which is
what a misspelled component key looks like from the inside. Development only; a
production build does not contain it.

## Compared with the Angular UI

The extension points, the component keys and the contributor signatures are ABP's, so a
configuration migrates. The differences are in the design docs' `api-parity-map.md`; the
ones that show up first:

| Angular | here |
| --- | --- |
| `valueResolver` returns HTML, rendered with `innerHTML` | returns text; a column that needs more names a `component` |
| row buttons collapse into an ng-bootstrap dropdown | into a `details` disclosure — the contract layer has no dropdown |
| `checkPolicies` deletes properties out of the configuration state | filtering returns a new object |
| no way to see what the extension points hold | `__abpvue.dump()` |
| lists remember nothing | `persistKey` remembers the page size, the sorting and the hidden columns, per user |

## Licence

MIT.
