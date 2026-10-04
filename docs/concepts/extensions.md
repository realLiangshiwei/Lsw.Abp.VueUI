# Page extensions

Reusable modules expose five extension points. Host applications contribute to built-in pages without editing package files. Ordinary generated business pages define their own columns, controls and CRUD methods.

| Extension point | Module option | Guide |
| --- | --- | --- |
| Columns | `entityPropContributors` | [Table columns](/customization/table-columns) |
| Create fields | `createFormPropContributors` | [Form fields](/customization/form-fields) |
| Edit fields | `editFormPropContributors` | [Form fields](/customization/form-fields) |
| Row actions | `entityActionContributors` | [Entity actions](/customization/entity-actions) |
| Toolbar | `toolbarActionContributors` | [Toolbar actions](/customization/toolbar-actions) |

## Start with one contributor

<<< ../examples/users-extension.ts

The map key is the exact public component key, such as `Identity.UsersComponent`. A contributor receives a mutable linked list and changes it. It does not return the new list. Pass its option map to the module route factory, as shown in the [users tutorial](/tutorials/extend-users).

Use a stable field name or localization key when locating an existing entry. Labels rendered in the current language are not stable identifiers.

## Assembly order and scope

1. The module adds its defaults.
2. Supported backend object-extension metadata becomes columns and controls.
3. Host contributors add, remove or replace entries.
4. The route renders the page under the module's injector.

Entering the route assembles fresh lists. Contributors should describe the result and avoid registering more contributors from inside a contributor. A module initializer adds its menu; the route factory owns the page's extension options.

Callbacks can be outside setup. `data.getInjected(Token)` resolves services from the extension's injector; calling ordinary `inject` from a click callback is invalid.

## Work with the linked list

~~~ts
props.addAfter(customProp, prop => prop.name === 'userName');
props.dropByValue(prop => prop.name === 'email');
props.addByIndex(customProp, 2);
~~~

Here `props` and `customProp` refer to the typed list and property supplied by your contributor. Relative insertion is more resilient than a numeric position. If `addAfter` finds no match it appends; `addBefore` with no match prepends. `dropByValue` removes the first match; `dropByValueAll` removes every match.

See [extension behavior](/customization/extension-behavior) for callback context, list operations and runtime defaults.

## Row and toolbar context

`EntityAction<IdentityUserDto>` receives one row in `data.record`. `ToolbarAction<readonly IdentityUserDto[]>` receives current-page records, not selected rows and not every record in the database. Plain `RowAction<R>` on a business page receives `R` directly.

`valueResolver` may return a value, Promise, Ref or getter. Its result is text. Rich cells use a Vue component, whose props include `record`, `index`, `prop` and `value`. Form components use a different model contract; see [form fields](/customization/form-fields).

## Preserve backend behavior

An extra field uses `isExtra: true` and an actual backend extension property. A new frontend field does not automatically create backend storage. Permission and visibility predicates only control UI; APIs remain authorized on the server.

Contributors change configured entries. A full component replacement owns its UI and commands. See [replacement](/customization/replacement) for preserving the built-in page while wrapping it.
