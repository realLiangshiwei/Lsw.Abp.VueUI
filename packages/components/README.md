# @lsw-abpvue/components

The extension system of [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an
**unofficial** Vue UI for the [ABP Framework](https://abp.io). It is what makes a module's
pages extensible without forking them: a host adds a column, a field, a row button or a
toolbar button by registering a contributor, and the module's code does not change.

```bash
pnpm add @lsw-abpvue/components
```

## The five extension points

```ts
const extensions = inject(ExtensionsService);

extensions.entityProps; // table columns
extensions.createFormProps; // fields of the create form
extensions.editFormProps; // fields of the edit form
extensions.entityActions; // buttons on a row
extensions.toolbarActions; // buttons above the table
```

Each holds contributors per component key, e.g. `Identity.UsersComponent`. A module
assembles its own defaults, the backend's object extensions and the application's
contributors in that order:

```ts
mergeWithDefaultProps(
  extensions.entityProps,
  DEFAULT_USERS_ENTITY_PROPS, // the module's own
  objectExtensionContributors.prop, // what the backend's ObjectExtensions add
  hostContributors, // what the application registered
);
```

Later contributors see what the earlier ones built, so they can insert, drop or reorder:

```ts
export function addIsbnColumn(propList: EntityPropList<BookDto>) {
  propList.add(EntityProp.create({ type: PropType.String, name: 'isbn' })).after(
    'name',
    (prop, name) => prop.name === name,
  );
}
```

Assembling again replaces the result rather than adding a second copy of every column, so
a repeated navigation is harmless.

## Compared with the Angular UI

The extension points, the component keys and the contributor signatures are ABP's, so
configuration migrates. The differences are in `api-parity-map.md`; the one that shows up
first is that `valueResolver` returns text rather than HTML, and a column that needs more
than text names a `component`.

## Licence

MIT.
