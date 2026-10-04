# AbpDataTable

A table driven by explicit columns and records.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpDataTable.vue)

## Usage

```vue
<AbpDataTable :data="books" :columns="columns" record-key="id">
  <template #cell-name="{ row }"><strong>{{ row.name }}</strong></template>
</AbpDataTable>
```

## Behavior

Sorting updates the `sortKey` and `sortOrder` named models; update your list query to load the sorted data. Selection and expanded rows use named v-model bindings. Table cells render text by default.

## Props

| Name         | Type                                | Required | Default     |
| ------------ | ----------------------------------- | -------- | ----------- |
| `columns`    | `readonly AbpTableColumn<R>[]`      | Yes      | —           |
| `data`       | `readonly R[]`                      | Yes      | —           |
| `recordKey`  | `AbpTableRecordKey<R> \| undefined` | No       | `undefined` |
| `caption`    | `string \| undefined`               | No       | `undefined` |
| `selectable` | `boolean \| undefined`              | No       | `false`     |
| `expandable` | `boolean \| undefined`              | No       | `false`     |
| `loading`    | `boolean \| undefined`              | No       | `false`     |
| `emptyText`  | `string \| undefined`               | No       | `undefined` |
| `sortKey`    | `string`                            | No       | `''`        |
| `sortOrder`  | `SortOrder`                         | No       | `''`        |
| `selected`   | `string[]`                          | No       | `() => []`  |
| `expanded`   | `string[]`                          | No       | `() => []`  |

## Events

| Name               | Payload              |
| ------------------ | -------------------- |
| `update:sortKey`   | `[value: string]`    |
| `update:sortOrder` | `[value: SortOrder]` |
| `update:selected`  | `[value: string[]]`  |
| `update:expanded`  | `[value: string[]]`  |

## Slots

| Name             | Context                                                         |
| ---------------- | --------------------------------------------------------------- |
| `toolbar`        | `() => unknown`                                                 |
| `expanded-row`   | `(props: { row: R; index: number }) => unknown`                 |
| `empty`          | `() => unknown`                                                 |
| `cell-${string}` | `(props: { row: R; value: unknown; index: number }) => unknown` |

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/components)
