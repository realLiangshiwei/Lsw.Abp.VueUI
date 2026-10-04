# AbpSelect

基于选项的单选或多选控件。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpSelect.vue)

## 用法

```vue
<AbpSelect v-model="category" :options="categories" clearable />
```

## 行为说明

选项包含 value 和 label；多选值是数组。label 是显示文本，需要传入前完成本地化。

## Props

| 名称              | 类型                                                       | 必填 | 默认值 |
| ----------------- | ---------------------------------------------------------- | ---- | ------ |
| `modelValue`      | `AbpOptionValue \| readonly AbpOptionValue[] \| undefined` | 否   | —      |
| `options`         | `readonly AbpOption[]`                                     | 是   | —      |
| `multiple`        | `boolean \| undefined`                                     | 否   | —      |
| `placeholder`     | `string \| undefined`                                      | 否   | —      |
| `disabled`        | `boolean \| undefined`                                     | 否   | —      |
| `readonly`        | `boolean \| undefined`                                     | 否   | —      |
| `invalid`         | `boolean \| undefined`                                     | 否   | —      |
| `clearable`       | `boolean \| undefined`                                     | 否   | —      |
| `id`              | `string \| undefined`                                      | 否   | —      |
| `name`            | `string \| undefined`                                      | 否   | —      |
| `ariaDescribedby` | `string \| undefined`                                      | 否   | —      |
| `ariaLabel`       | `string \| undefined`                                      | 否   | —      |

## Events

| 名称                | 参数                                          |
| ------------------- | --------------------------------------------- |
| `update:modelValue` | `[value: AbpOptionValue \| AbpOptionValue[]]` |

## Slots

| 名称     | 上下文                                                           |
| -------- | ---------------------------------------------------------------- |
| `option` | `(context: { option: AbpOption; selected: boolean }) => unknown` |

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
