<script setup>
import Example from "../examples/TableExample.vue";
</script>

# AbpDataTable

`AbpDataTable` renders the records and columns supplied by a page. It controls sorting intent, selected ids and expanded ids; the caller owns data fetching and pagination.

## Columns, selection and detail rows

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/TableExample.vue

Select rows, expand a detail row, and sort Name or Price. This example explicitly sorts a local array; a backend page should bind the models to `useListService` instead.

## Define a column

`id` is the column's stable identity, default record-property lookup and sort key. `header` is already localized. A `value(row, index)` function computes a value when the record has no matching property. `width` is a pixel hint; a wide table scrolls horizontally rather than squeezing every column.

Use `cell-{id}` to render a link, currency or action. The slot supplies `{ row, value, index }`. Vue text interpolation is escaped; avoid turning backend strings into raw HTML. A custom interactive cell needs its own label and keyboard behavior.

## Server sorting

Clicking a sortable header cycles ascending, descending and unsorted states. The table emits model changes; it does not reorder server records itself. Bind `sortKey` and `sortOrder` to your query state and ensure column ids match backend sorting fields. Reset paging when sorting changes; [the list example](/utilities/lists) shows the query connection.

## Stable record ids

Use `record-key="id"` or a key function. Without it, the index is used, which is unsafe for selection after sorting or paging. `selected` and `expanded` contain strings. Select-all changes ids on the visible page, preserving other ids already in the model. The application decides whether to preserve or clear selection when changing filters and must validate ids again before a bulk request.

## Loading and empty states

Bind `loading` during a request and supply an `empty` slot or already localized `emptyText`. Loading is not a failure message; retain a separate query error and retry command. Set `caption` to name the table for assistive technology.

For reusable module contributors, use [AbpExtensibleTable](/components/extensible-table).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpDataTable.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

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

### Events

| Name               | Payload              |
| ------------------ | -------------------- |
| `update:sortKey`   | `[value: string]`    |
| `update:sortOrder` | `[value: SortOrder]` |
| `update:selected`  | `[value: string[]]`  |
| `update:expanded`  | `[value: string[]]`  |

### Slots

| Name             | Context                                                         |
| ---------------- | --------------------------------------------------------------- |
| `toolbar`        | `() => unknown`                                                 |
| `expanded-row`   | `(props: { row: R; index: number }) => unknown`                 |
| `empty`          | `() => unknown`                                                 |
| `cell-${string}` | `(props: { row: R; value: unknown; index: number }) => unknown` |

<!-- component-contract:end -->
