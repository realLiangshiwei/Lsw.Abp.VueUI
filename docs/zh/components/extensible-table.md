# AbpExtensibleTable

通过列和操作贡献者装配的模块表格。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpExtensibleTable.vue)

## 用法

```vue
<AbpExtensibleTable :data="items" :list="list" record-key="id" searchable />
```

## 行为说明

需要模块的 EXTENSIONS_IDENTIFIER 和已解析的贡献者。处理分页、排序、记录范围与可选搜索。列显隐与列表共用偏好 key。显式定义列的应用页面使用 AbpDataTable。

## Props

| 名称                 | 类型                   | 必填 | 默认值      |
| -------------------- | ---------------------- | ---- | ----------- |
| `data`               | `readonly R[]`         | 是   | —           |
| `list`               | `ListService`          | 是   | —           |
| `recordKey`          | `string \| undefined`  | 否   | `undefined` |
| `actionsText`        | `string \| undefined`  | 否   | `undefined` |
| `actionsColumnWidth` | `number \| undefined`  | 否   | `undefined` |
| `caption`            | `string \| undefined`  | 否   | `undefined` |
| `selectable`         | `boolean \| undefined` | 否   | `false`     |
| `expandable`         | `boolean \| undefined` | 否   | `false`     |
| `searchable`         | `boolean \| undefined` | 否   | `false`     |
| `persistKey`         | `string \| undefined`  | 否   | `undefined` |
| `selected`           | `string[]`             | 否   | `() => []`  |
| `expanded`           | `string[]`             | 否   | `() => []`  |
| `hiddenColumns`      | `string[]`             | 否   | `() => []`  |

## Events

| 名称                   | 参数                |
| ---------------------- | ------------------- |
| `update:selected`      | `[value: string[]]` |
| `update:expanded`      | `[value: string[]]` |
| `update:hiddenColumns` | `[value: string[]]` |

## Slots

| 名称             | 上下文                                                            |
| ---------------- | ----------------------------------------------------------------- |
| `toolbar`        | `() => unknown`                                                   |
| `expanded-row`   | `(props: { row: R; index: number }) => unknown`                   |
| `empty`          | `() => unknown`                                                   |
| `cell-${string}` | `(props: { row: R; value: PropValue; index: number }) => unknown` |

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/components)
