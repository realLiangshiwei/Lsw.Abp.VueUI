<script setup>
import Example from "../../examples/ValidationExample.vue";
</script>

# AbpFormField

`AbpFormField` 将标签、提示和错误列表连接到控件，不持有值，也不运行验证器。

## 连接可访问的验证字段

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/ValidationExample.vue

提交空 email，修正后再 Reset。useAbpForm 管理值和验证，字段只显示生成的消息。显式 blur 回调将控制标为 touched。

## 插槽连接

默认插槽提供 id、describedBy 和 invalid，分别绑定控件的 id、aria-describedby 和 invalid。省略这些连接，标签可能外观正确，却无法与控件建立可访问关联。

for 可以指定固定 id，否则组件生成 id。重复字段时必须保持唯一。required 显示必填提示，实际规则仍应写在表单中。disabled 表示字段状态，子控件也需要显式禁用。

## 显示时机与定制

errors 接收已本地化字符串，非空列表会使字段 invalid。示例使用访问字段或提交后显示错误的常见策略。label、hint、errors 插槽可定制显示，errors 插槽提供消息列表。

后端错误参见[服务端验证](/zh/utilities/forms)。无法对应字段的错误应在表单级显示，避免请求被拒绝后没有任何反馈。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpFormField.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称       | 类型                             | 必填 | 默认值     |
| ---------- | -------------------------------- | ---- | ---------- |
| `label`    | `string \| undefined`            | 否   | —          |
| `for`      | `string \| undefined`            | 否   | —          |
| `required` | `boolean \| undefined`           | 否   | —          |
| `hint`     | `string \| undefined`            | 否   | —          |
| `errors`   | `readonly string[] \| undefined` | 否   | `() => []` |
| `disabled` | `boolean \| undefined`           | 否   | —          |

### Events

没有声明组件专有事件。

### Slots

| 名称      | 上下文                                                |
| --------- | ----------------------------------------------------- |
| `default` | `(context: AbpFormFieldContext) => unknown`           |
| `label`   | `() => unknown`                                       |
| `hint`    | `() => unknown`                                       |
| `errors`  | `(context: { errors: readonly string[] }) => unknown` |

<!-- component-contract:end -->
