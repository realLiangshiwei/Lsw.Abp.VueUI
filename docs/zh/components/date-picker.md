# AbpDatePicker

以 ISO 字符串绑定日期、时间或日期时间。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpDatePicker.vue)

## 用法

```vue
<AbpDatePicker v-model="publishDate" type="date" clearable />
```

## 行为说明

绑定值保持字符串，便于传入 ABP DTO。Basic Theme 提供符合文化格式的分段输入和日历。按 DTO 选择 date、time 或 datetime，并设置 min/max；显示格式与时区转换是不同操作。

## Props

| 名称              | 类型                          | 必填 | 默认值   |
| ----------------- | ----------------------------- | ---- | -------- |
| `modelValue`      | `string \| null \| undefined` | 否   | —        |
| `type`            | `AbpDateType \| undefined`    | 否   | `'date'` |
| `min`             | `string \| null \| undefined` | 否   | —        |
| `max`             | `string \| null \| undefined` | 否   | —        |
| `placeholder`     | `string \| undefined`         | 否   | —        |
| `disabled`        | `boolean \| undefined`        | 否   | —        |
| `readonly`        | `boolean \| undefined`        | 否   | —        |
| `invalid`         | `boolean \| undefined`        | 否   | —        |
| `clearable`       | `boolean \| undefined`        | 否   | —        |
| `id`              | `string \| undefined`         | 否   | —        |
| `name`            | `string \| undefined`         | 否   | —        |
| `ariaDescribedby` | `string \| undefined`         | 否   | —        |
| `ariaLabel`       | `string \| undefined`         | 否   | —        |

## Events

| 名称                | 参数                      |
| ------------------- | ------------------------- |
| `update:modelValue` | `[value: string \| null]` |

## Slots

没有命名插槽。

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
