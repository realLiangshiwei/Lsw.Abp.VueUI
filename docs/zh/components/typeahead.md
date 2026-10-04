# AbpTypeahead

异步查找控件，分别保存值和显示文本。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpTypeahead.vue)

## 用法

```vue
<AbpTypeahead v-model="authorId" v-model:display-value="authorName" :search="searchAuthors" />
```

## 行为说明

search 返回 value/label 选项，并接收 AbortSignal；请求应使用该信号。displayValue 可显示已有记录而无需额外查询。Basic Theme 当前沿用已有自动完成实现，reka-ui 迁移尚未完成。

## Props

| 名称              | 类型                                                                          | 必填 | 默认值 |
| ----------------- | ----------------------------------------------------------------------------- | ---- | ------ |
| `modelValue`      | `AbpOptionValue \| undefined`                                                 | 否   | —      |
| `displayValue`    | `string \| undefined`                                                         | 否   | `''`   |
| `search`          | `(term: string, signal: AbortSignal) => Promise<readonly AbpTypeaheadItem[]>` | 是   | —      |
| `debounce`        | `number \| undefined`                                                         | 否   | `300`  |
| `minLength`       | `number \| undefined`                                                         | 否   | `1`    |
| `placeholder`     | `string \| undefined`                                                         | 否   | —      |
| `disabled`        | `boolean \| undefined`                                                        | 否   | —      |
| `readonly`        | `boolean \| undefined`                                                        | 否   | —      |
| `invalid`         | `boolean \| undefined`                                                        | 否   | —      |
| `clearable`       | `boolean \| undefined`                                                        | 否   | —      |
| `id`              | `string \| undefined`                                                         | 否   | —      |
| `name`            | `string \| undefined`                                                         | 否   | —      |
| `ariaDescribedby` | `string \| undefined`                                                         | 否   | —      |
| `ariaLabel`       | `string \| undefined`                                                         | 否   | —      |

## Events

| 名称                  | 参数                               |
| --------------------- | ---------------------------------- |
| `update:modelValue`   | `[value: AbpOptionValue]`          |
| `update:displayValue` | `[value: string]`                  |
| `select`              | `[item: AbpTypeaheadItem \| null]` |

## Slots

| 名称    | 上下文                                                              |
| ------- | ------------------------------------------------------------------- |
| `item`  | `(context: { item: AbpTypeaheadItem; active: boolean }) => unknown` |
| `empty` | `() => unknown`                                                     |

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
