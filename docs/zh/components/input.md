# AbpInput

主题输入框、多行文本和密码输入框。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpInput.vue)

## 用法

```vue
<AbpInput v-model="name" autocomplete="name" :invalid="invalid" />
```

## 行为说明

数字值使用 type="number"。文本输入输出字符串，清空数字输入可输出 null。使用 AbpFormField 关联标签。

## Props

| 名称              | 类型                                    | 必填 | 默认值   |
| ----------------- | --------------------------------------- | ---- | -------- |
| `modelValue`      | `string \| number \| null \| undefined` | 否   | —        |
| `type`            | `AbpInputType \| undefined`             | 否   | `'text'` |
| `placeholder`     | `string \| undefined`                   | 否   | —        |
| `disabled`        | `boolean \| undefined`                  | 否   | —        |
| `readonly`        | `boolean \| undefined`                  | 否   | —        |
| `invalid`         | `boolean \| undefined`                  | 否   | —        |
| `id`              | `string \| undefined`                   | 否   | —        |
| `name`            | `string \| undefined`                   | 否   | —        |
| `autocomplete`    | `string \| undefined`                   | 否   | —        |
| `rows`            | `number \| undefined`                   | 否   | `3`      |
| `min`             | `number \| undefined`                   | 否   | —        |
| `max`             | `number \| undefined`                   | 否   | —        |
| `step`            | `number \| undefined`                   | 否   | —        |
| `maxlength`       | `number \| undefined`                   | 否   | —        |
| `revealable`      | `boolean \| undefined`                  | 否   | —        |
| `ariaDescribedby` | `string \| undefined`                   | 否   | —        |
| `ariaLabel`       | `string \| undefined`                   | 否   | —        |

## Events

| 名称                | 参数                                |
| ------------------- | ----------------------------------- |
| `update:modelValue` | `[value: string \| number \| null]` |
| `blur`              | `[event: FocusEvent]`               |
| `focus`             | `[event: FocusEvent]`               |

## Slots

没有命名插槽。

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
