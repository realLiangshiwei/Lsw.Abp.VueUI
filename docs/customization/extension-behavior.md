# Extension behavior and defaults

This page explains contributor callbacks, defaults and form payloads. Use your IDE to inspect types from `@lsw-abpvue/components` and `@lsw-abpvue/utils`; the four extension guides provide complete examples.

## Callback context

The callback receives a data object with `record`, an optional `index` and `getInjected`. Its record is a row for an entity action/property and a readonly current-page array for an Identity toolbar action. `getInjected` can resolve services when the callback is outside setup. Async resolved values are undefined until they arrive; render an appropriate empty state.

## Property and form defaults

| Option | Default | Meaning |
| --- | --- | --- |
| `displayName` | `name` | Localization key |
| `permission` | Empty | No extra policy requirement |
| `visible` | Always true | Row/form visibility predicate |
| `isExtra` | False | Extra-property path |
| `EntityProp.sortable` | False | Backend sorting is opt-in |
| `EntityProp.columnVisible` | Always true | Whole-column visibility |
| `FormProp.disabled/readonly` | Always false | Initial control state |
| `FormProp.autocomplete` | `off` | Input autocomplete |
| `FormProp.id` | `name` | Control identity |
| `FormProp.validators` | Empty array | Rules supplied by the contributor |

`FormProp` uses its defaultValue if no stored value is present. Without one, boolean controls start false, multi-select starts with an empty array, number starts null and other types start with an empty string.

A column component receives `record/index/prop/value`. A form component receives `modelValue/prop/record/disabled/readonly` and emits `update:modelValue`. Their contracts are different.

## Actions

`EntityAction.create<R>(options)` and `ToolbarAction.create<R>(options)` return configured actions. Their createMany variants preserve order.

| Option | Default / behavior |
| --- | --- |
| `text`, `action` | Required localized label and callback |
| `icon`, `permission` | Empty string |
| `visible` | Always true |
| `EntityAction.showOnlyIcon` | False |
| `btnClass`, `btnStyle`, `tooltip` | Optional |

`visible` accepts optional data. A Promise returned by an action is allowed; the page/command owns busy state. A plain application `RowAction<R>` takes the record directly and has no automatic permission predicate: filter it yourself.

The current ToolbarAction contract has no component option. Use a Vue toolbar slot or a replacement page for a rendered custom control.

## List operations

Lists such as `EntityPropList<R>` and `FormPropList<R>` inherit `LinkedList<T>`.

| Operation | Result / behavior |
| --- | --- |
| `addHead(value)` / `addTail(value)` | Added `ListNode<T>` |
| `addByIndex(value, index)` | Added node or undefined |
| `addBefore(value, predicate)` | Added node; prepends if no match |
| `addAfter(value, predicate)` | Added node; appends if no match |
| `dropByValue(predicate)` | First removed node or undefined |
| `dropByValueAll(predicate)` | All removed nodes |
| `toArray()` | Values in list order |
| `add(value).after(predicate)` | Chainable form of addAfter |

Index zero is the first element. Relative locators also accept a target and comparison callback, for example `props.addAfter(customProp, 'userName', (prop, name) => prop.name === name)`. Inspect the LinkedList type in your IDE for other overloads and batch operations.

## Form payloads

`useExtensibleForm<R>(record?)` returns `{ form, props, isEdit, toRequestBody }`. An existing nonempty record selects edit fields; otherwise it selects create fields. Call it in the page's setup context under the extension identifier.

`toRequestBody(): Record<string, unknown>` writes controls into ordinary fields or extraProperties and preserves previously stored extra properties. It does not send the request. The page must validate, submit, handle concurrency and refresh.

The record argument is the initial record for that form instance. For switching records in one modal, rebuild the appropriate form component/instance rather than assuming the argument remains a reactive record source.

## Assembly and registration

`mergeWithDefaultProps` combines module defaults, backend-generated contributors and host contributors in order. `mergeWithDefaultActions` handles action lists. Ordinary host applications normally pass contributor maps to a module's route factory rather than calling these assembly helpers directly.

Examples: [columns](/customization/table-columns), [fields](/customization/form-fields), [row actions](/customization/entity-actions), [toolbar](/customization/toolbar-actions).
