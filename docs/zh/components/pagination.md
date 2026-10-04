<script setup>
import Example from "../../examples/PaginationExample.vue";
</script>

# AbpPagination

`AbpPagination` 控制页码和每页数量。total 是记录总数，不是总页数。

## 页码与记录范围

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/PaginationExample.vue

切换页码或每页数量，观察实际请求参数。界面从第 1 页开始，绑定的 `page` 从 0 开始。

## 与列表绑定

绑定 `v-model:page="list.page.value"`、`v-model:page-size="list.maxResultCount.value"` 和查询返回的记录总数。`useListService` 会在状态变化后重新请求。手动管理列表时，需要自行在数量或过滤条件变化后归零页码并发出请求。

必须显式设置 `show-size-selector` 才会显示数量下拉框。`pageSizes` 定义选项，使用符合后端上限的正整数。分页组件不切分数据，也不发请求。

## 范围文字与空结果

独立分页组件不显示 “Showing 1 to 10 of 47 entries”。按照示例在页面计算，或本地化 `AbpUi::PagerInfo{0}{1}{2}`。总数为零时起止均为零。实际返回数量可能小于请求数量，结束位置应使用实际 items 长度。

`AbpExtensibleTable` 已经包含范围文字和分页，不要再追加第二组。删除当前页最后一条记录后，如果页码超出范围，应退回有效页并重新加载。

参见[列表](/zh/utilities/lists)和[数据表格](/zh/components/data-table)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpPagination.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称               | 类型                             | 必填 | 默认值                    |
| ------------------ | -------------------------------- | ---- | ------------------------- |
| `page`             | `number`                         | 是   | —                         |
| `pageSize`         | `number`                         | 是   | —                         |
| `total`            | `number`                         | 是   | —                         |
| `siblingCount`     | `number \| undefined`            | 否   | `1`                       |
| `showSizeSelector` | `boolean \| undefined`           | 否   | —                         |
| `pageSizes`        | `readonly number[] \| undefined` | 否   | `() => [10, 25, 50, 100]` |
| `disabled`         | `boolean \| undefined`           | 否   | —                         |
| `ariaLabel`        | `string \| undefined`            | 否   | —                         |

### Events

| 名称              | 参数              |
| ----------------- | ----------------- |
| `update:page`     | `[value: number]` |
| `update:pageSize` | `[value: number]` |

### Slots

没有命名插槽。

<!-- component-contract:end -->
