# Page extensions

Reusable module pages expose five extension points. Use these to customize built-in pages from the host application. An application-specific generated page instead owns its columns and CRUD methods directly.

| Point | Controls |
| --- | --- |
| `entityProps` | Table columns |
| `createFormProps` | Create fields |
| `editFormProps` | Edit fields |
| `entityActions` | Row actions |
| `toolbarActions` | Toolbar actions |

## Contributors

Pass contributor maps to the module's route factory, keyed by its public component identifier. This typed example adds a column and action to the users page:

<<< ../examples/users-extension.ts

The [users tutorial](/tutorials/extend-users) shows route registration. Contributor lists support `addHead`, `addTail`, `addByIndex`, insertion relative to another item, and corresponding removal operations. See exported list types in [components](/api/components) for exact signatures.

## Assembly order

Module defaults are assembled first, then supported backend object extensions, then host contributors. Assembly runs in the route resolver before rendering. Re-entering the route rebuilds the contribution set without duplicating columns.

## Values and actions

`valueResolver(data)` reads a record and returns display text, optionally through a promise or reactive value. Use `data.getInjected(Token)` for services in a callback. A rich cell can use a Vue component receiving record, index, prop and value; resolver text is not inserted as HTML.

`EntityAction` receives `PropData` and supports permission and visibility conditions. Ordinary application `RowAction` callbacks receive the record directly. Toolbar actions use the current page's records. These callback differences matter when moving code between the two page styles.

Component keys and backend identifiers match Angular. Callbacks returning Observables and Angular component classes need adaptation to Vue; the entire configuration is not automatically interchangeable.
