# AbpPagination

从零开始的分页与每页条数选择器。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpPagination.vue)

## 用法

```vue
<AbpPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
```

## 行为说明

ListService.page 从零开始，可直接绑定。total 是记录总数，不是页数。普通页面自行显示记录范围；AbpExtensibleTable 已包含该摘要。

## Props

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

## Events

| 名称              | 参数              |
| ----------------- | ----------------- |
| `update:page`     | `[value: number]` |
| `update:pageSize` | `[value: number]` |

## Slots

没有命名插槽。

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
