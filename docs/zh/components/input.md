<script setup>
import Example from "../../examples/InputExample.vue";
</script>

# AbpInput

`AbpInput` 编辑文本或数字。配合 `AbpFormField` 可显示标签、提示与验证消息。

## 绑定不同输入类型

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/InputExample.vue

示例包含长度受限的文本、数字、可显示明文的密码和多行文本。修改或清空 Copies，可以看到绑定值的变化。

## 绑定值的类型

文本输入发出字符串；数字输入发出数字，清空时发出 `null`。声明与控件相符的模型，不能假定所有输入都返回字符串。`type="textarea"` 使用 `rows`，密码输入增加 `revealable` 后会显示切换可见性的按钮。

`min`、`max`、`step`、`maxlength` 设置原生输入约束，不能替代业务验证或后端验证。提交过程参见[表单与验证](/zh/utilities/forms)。

## 标签、提示与错误

绑定字段插槽提供的 `id`、`describedBy`、`invalid`。id 连接标签，`aria-describedby` 连接提示和错误。独立使用时，提供 `aria-label` 或通过 id 连接外部标签。需要浏览器自动填充时设置 `autocomplete` 和 `name`。

## 禁用与只读

请求期间不允许交互时使用 disabled；希望保留查看、选择文本的能力时使用 readonly。这两种状态都不提供请求授权，字段是否写入 DTO 由页面决定。

如果希望离开输入框后显示错误，在 `blur` 中将表单控制标为 touched。`focus` 和 `blur` 携带原生焦点事件。`invalid` 负责外观和可访问状态，不计算规则，也不显示错误文字。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpInput.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

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

### Events

| 名称                | 参数                                |
| ------------------- | ----------------------------------- |
| `update:modelValue` | `[value: string \| number \| null]` |
| `blur`              | `[event: FocusEvent]`               |
| `focus`             | `[event: FocusEvent]`               |

### Slots

没有命名插槽。

<!-- component-contract:end -->
