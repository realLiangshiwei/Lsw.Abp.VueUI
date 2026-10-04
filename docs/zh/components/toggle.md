# AbpToggle

复选框或开关。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpToggle.vue)

## 用法

```vue
<AbpToggle v-model="enabled" variant="switch" aria-label="Enabled" />
```

## 行为说明

checkbox 和 switch 绑定布尔值，radio 绑定所选选项的值。`indeterminate` 用于 checkbox。示例使用布尔开关。

## Props

| 名称              | 类型                                             | 必填 | 默认值       |
| ----------------- | ------------------------------------------------ | ---- | ------------ |
| `modelValue`      | `boolean \| AbpOptionValue \| undefined`         | 否   | —            |
| `variant`         | `'checkbox' \| 'switch' \| 'radio' \| undefined` | 否   | `'checkbox'` |
| `label`           | `string \| undefined`                            | 否   | —            |
| `options`         | `readonly AbpOption[] \| undefined`              | 否   | —            |
| `disabled`        | `boolean \| undefined`                           | 否   | —            |
| `readonly`        | `boolean \| undefined`                           | 否   | —            |
| `invalid`         | `boolean \| undefined`                           | 否   | —            |
| `indeterminate`   | `boolean \| undefined`                           | 否   | —            |
| `id`              | `string \| undefined`                            | 否   | —            |
| `name`            | `string \| undefined`                            | 否   | —            |
| `ariaDescribedby` | `string \| undefined`                            | 否   | —            |
| `ariaLabel`       | `string \| undefined`                            | 否   | —            |

## Events

| 名称                | 参数                                 |
| ------------------- | ------------------------------------ |
| `update:modelValue` | `[value: boolean \| AbpOptionValue]` |

## Slots

没有命名插槽。

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
