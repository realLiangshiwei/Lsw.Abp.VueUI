<script setup>
import Example from "../../examples/TableExample.vue";
</script>

# AbpDataTable

`AbpDataTable` 渲染页面提供的记录和列，管理排序意图、选中 id 和展开 id。请求与分页由页面负责。

## 列、选择与详情行

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/TableExample.vue

勾选记录、展开详情，并点击 Name 或 Price 排序。示例明确对本地数组排序；后端分页页面应将模型绑定到 `useListService`。

## 定义列

`id` 是列的稳定标识，也用于默认读取记录属性和生成排序字段。header 是已经本地化的文字。记录没有同名属性时，通过 `value(row, index)` 计算。width 是像素宽度提示，宽表格会横向滚动。

`cell-{id}` 用于链接、货币或操作显示，提供 `{ row, value, index }`。Vue 文本插值会转义，不要把后端字符串直接作为 HTML。可交互的自定义单元格需要自己的标签和键盘行为。

## 后端排序

点击可排序标题会依次切换升序、降序、无排序。表格发出模型变化，不自动重排后端记录。将 sortKey、sortOrder 绑定到查询状态，并确保列 id 与后端排序字段一致。排序变化需要重置页码，[列表示例](/zh/utilities/lists)展示了请求连接。

## 稳定记录 id

使用 `record-key="id"` 或键函数。省略后使用索引，排序和翻页时会导致选择对应错误。selected、expanded 保存字符串 id。全选只改变当前可见页的 id，保留模型中的其他 id。过滤条件变化时是否保留选择由页面决定，批量请求前仍需检查这些 id。

## 加载和空状态

请求期间绑定 loading，空数据通过 empty 插槽或已本地化的 emptyText 显示。加载状态不是错误提示，需要单独保存查询错误并提供重试。caption 为辅助技术提供表格名称。

需要可复用模块贡献器时使用[可扩展表格](/zh/components/extensible-table)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpDataTable.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称         | 类型                                | 必填 | 默认值      |
| ------------ | ----------------------------------- | ---- | ----------- |
| `columns`    | `readonly AbpTableColumn<R>[]`      | 是   | —           |
| `data`       | `readonly R[]`                      | 是   | —           |
| `recordKey`  | `AbpTableRecordKey<R> \| undefined` | 否   | `undefined` |
| `caption`    | `string \| undefined`               | 否   | `undefined` |
| `selectable` | `boolean \| undefined`              | 否   | `false`     |
| `expandable` | `boolean \| undefined`              | 否   | `false`     |
| `loading`    | `boolean \| undefined`              | 否   | `false`     |
| `emptyText`  | `string \| undefined`               | 否   | `undefined` |
| `sortKey`    | `string`                            | 否   | `''`        |
| `sortOrder`  | `SortOrder`                         | 否   | `''`        |
| `selected`   | `string[]`                          | 否   | `() => []`  |
| `expanded`   | `string[]`                          | 否   | `() => []`  |

### Events

| 名称               | 参数                 |
| ------------------ | -------------------- |
| `update:sortKey`   | `[value: string]`    |
| `update:sortOrder` | `[value: SortOrder]` |
| `update:selected`  | `[value: string[]]`  |
| `update:expanded`  | `[value: string[]]`  |

### Slots

| 名称             | 上下文                                                          |
| ---------------- | --------------------------------------------------------------- |
| `toolbar`        | `() => unknown`                                                 |
| `expanded-row`   | `(props: { row: R; index: number }) => unknown`                 |
| `empty`          | `() => unknown`                                                 |
| `cell-${string}` | `(props: { row: R; value: unknown; index: number }) => unknown` |

<!-- component-contract:end -->
