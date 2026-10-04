<script setup>
import Example from "../../examples/ToggleExample.vue";
</script>

# AbpToggle

`AbpToggle` 用于布尔选项或单选组。

## 复选框、开关与单选

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/ToggleExample.vue

复选框和开关绑定布尔值，单选组绑定某个选项值。标签和选项标签是已本地化文字；需要随语言变化时，由本地化服务配合 computed 生成。

## 选择控件

接受条款、选择记录适合复选框，启用设置适合开关，少量互斥选项适合保持可见的单选组。较长列表可使用[选择器](/zh/components/select)。

indeterminate 表示复选框的混合显示状态，例如部分行被选中，不是第三种可保存的布尔值。实际选择由页面保存，根据选择结果计算混合状态。

## 表单与可访问性

提供 label 或 aria-label，尤其是表格里的控件。保存时绑定 disabled，有验证消息时绑定 invalid。控件发出 update:modelValue，不会自动保存设置。

必须勾选同意时，仅使用 Validators.required() 不够，因为 false 也是已定义的值。增加要求 true 的自定义验证器，并在后端执行同一规则。参见[验证](/zh/utilities/forms)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpToggle.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

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

### Events

| 名称                | 参数                                 |
| ------------------- | ------------------------------------ |
| `update:modelValue` | `[value: boolean \| AbpOptionValue]` |

### Slots

没有命名插槽。

<!-- component-contract:end -->
