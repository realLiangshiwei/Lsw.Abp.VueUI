# AbpExtensibleTable

A module table assembled from column and action contributors.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpExtensibleTable.vue)

## Usage

```vue
<AbpExtensibleTable :data="items" :list="list" record-key="id" searchable />
```

## Behavior

Requires the module's EXTENSIONS_IDENTIFIER and resolved contributors. Handles paging, sorting, record range and optional search. Column visibility shares the list's preference key. Use AbpDataTable for an application page with explicit columns.

## Props

| Name                 | Type                   | Required | Default     |
| -------------------- | ---------------------- | -------- | ----------- |
| `data`               | `readonly R[]`         | Yes      | —           |
| `list`               | `ListService`          | Yes      | —           |
| `recordKey`          | `string \| undefined`  | No       | `undefined` |
| `actionsText`        | `string \| undefined`  | No       | `undefined` |
| `actionsColumnWidth` | `number \| undefined`  | No       | `undefined` |
| `caption`            | `string \| undefined`  | No       | `undefined` |
| `selectable`         | `boolean \| undefined` | No       | `false`     |
| `expandable`         | `boolean \| undefined` | No       | `false`     |
| `searchable`         | `boolean \| undefined` | No       | `false`     |
| `persistKey`         | `string \| undefined`  | No       | `undefined` |
| `selected`           | `string[]`             | No       | `() => []`  |
| `expanded`           | `string[]`             | No       | `() => []`  |
| `hiddenColumns`      | `string[]`             | No       | `() => []`  |

## Events

| Name                   | Payload             |
| ---------------------- | ------------------- |
| `update:selected`      | `[value: string[]]` |
| `update:expanded`      | `[value: string[]]` |
| `update:hiddenColumns` | `[value: string[]]` |

## Slots

| Name             | Context                                                           |
| ---------------- | ----------------------------------------------------------------- |
| `toolbar`        | `() => unknown`                                                   |
| `expanded-row`   | `(props: { row: R; index: number }) => unknown`                   |
| `empty`          | `() => unknown`                                                   |
| `cell-${string}` | `(props: { row: R; value: PropValue; index: number }) => unknown` |

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/components)
