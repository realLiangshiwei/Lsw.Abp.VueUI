# AbpDataTable

由显式列定义与记录驱动的表格。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpDataTable.vue)

## 用法

```vue
<AbpDataTable :data="books" :columns="columns" record-key="id">
  <template #cell-name="{ row }"><strong>{{ row.name }}</strong></template>
</AbpDataTable>
```

## 行为说明

排序更新 `sortKey` 和 `sortOrder` 命名模型，需要更新列表查询以加载排序数据。选择和展开行使用命名 v-model 绑定。默认单元格按文本渲染。

## Props

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

## Events

| 名称               | 参数                 |
| ------------------ | -------------------- |
| `update:sortKey`   | `[value: string]`    |
| `update:sortOrder` | `[value: SortOrder]` |
| `update:selected`  | `[value: string[]]`  |
| `update:expanded`  | `[value: string[]]`  |

## Slots

| 名称             | 上下文                                                          |
| ---------------- | --------------------------------------------------------------- |
| `toolbar`        | `() => unknown`                                                 |
| `expanded-row`   | `(props: { row: R; index: number }) => unknown`                 |
| `empty`          | `() => unknown`                                                 |
| `cell-${string}` | `(props: { row: R; value: unknown; index: number }) => unknown` |

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/components)
