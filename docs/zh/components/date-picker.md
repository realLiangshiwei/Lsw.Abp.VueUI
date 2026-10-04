<script setup>
import Example from "../../examples/DatePickerExample.vue";
</script>

# AbpDatePicker

`AbpDatePicker` 使用主题的日历与输入界面编辑日期、时间或本地日期时间。

## 三种值

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/DatePickerExample.vue

打开出版日期的日历、清空日期、修改时间片段，下方会显示实际绑定的字符串。

| 类型       | 绑定值示例         | 含义                       |
| ---------- | ------------------ | -------------------------- |
| `date`     | `2026-10-04`       | 不包含时区的日历日期       |
| `time`     | `09:30`            | 不包含日期的时间           |
| `datetime` | `2026-10-04T09:30` | 不包含偏移量的本地日期时间 |

模型是字符串或 null，不是 `Date`。显示格式遵循当前文化，显示形式与 API 表示是两个需要分别处理的问题。

## 范围与编辑

`min`、`max` 使用与字段类型一致的格式。可选字段可开启 `clearable`；清空后不允许保存时增加 required 验证。readonly 阻止编辑，disabled 还用于加载期间阻止交互。标签和错误属性的绑定方式与[输入框](/zh/components/input)一致。

## 保存代表时间点的值

生日、出版日期等只表示日历日期的值通常应保留日期字符串。代表具体时间点的预约需要明确时区规则。不能直接给本地值追加 `Z`，这只是把本地钟表时间标为 UTC，没有进行转换。保存前应根据应用约定的时区和 DTO 转换。

这个控件不选择时区，也不执行业务日期转换。显示格式与请求头行为参见[日期与时区](/zh/utilities/dates)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpDatePicker.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

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

### Events

| 名称                | 参数                      |
| ------------------- | ------------------------- |
| `update:modelValue` | `[value: string \| null]` |

### Slots

没有命名插槽。

<!-- component-contract:end -->
