<script setup>
import Example from "../../examples/ModalExample.vue";
</script>

# AbpModal

`AbpModal` 用于需要保护未保存更改的编辑任务。Basic Theme 提供对话框、焦点管理和取消时的丢弃确认。

## 编辑、保存与取消

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/ModalExample.vue

修改标题后点击 Cancel、关闭按钮或 Esc，可以查看丢弃确认。Save 延迟 800 毫秒后保存本地状态。演示自行包含确认宿主，实际应用布局已经提供。

需要验证与真实请求时，使用[模态表单示例](/zh/utilities/modals)。保存失败会保留对话框和已输入值。

## 关闭路径

| 操作                   | 行为                       |
| ---------------------- | -------------------------- |
| 页脚 `close()`         | 请求受保护的取消           |
| 关闭按钮、Esc、背景    | 请求受保护的取消           |
| 设置 `visible = false` | 应用主动关闭，跳过取消确认 |
| busy 时的用户关闭      | 被阻止                     |

取消按钮应调用 close()。保存成功后直接设为 false。如果 Cancel 直接赋值 false，就会绕过预期的丢弃保护。

## Dirty 与 busy

对话框会记录内部原生输入变化。自定义控件、其他代码修改的状态还应绑定 dirty。重新打开前重置或载入表单。dirty 说明取消需要考虑更改，不代表字段有效。

busy 保护用户关闭路径，自定义插槽内的控件仍需绑定 loading/disabled。只有明确希望直接取消的任务才使用 suppress-unsaved-changes-warning，它不跳过 busy 保护。

## 布局与可访问性

较宽表单可以设置 size 为 lg 或 xl，centered 用于垂直居中。header 内提供有意义的标题，没有标题时提供 aria-label。对话框会保持内部焦点，关闭后恢复焦点。避免独立的嵌套编辑对话框，丢弃问题可以交给确认宿主。

init、appear、disappear 表示可见性生命周期，不表示 CSS 动画已完成。初始记录应由页面工作流加载，然后再展示可编辑表单。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpModal.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称                            | 类型                                        | 必填 | 默认值 |
| ------------------------------- | ------------------------------------------- | ---- | ------ |
| `visible`                       | `boolean`                                   | 是   | —      |
| `busy`                          | `boolean \| undefined`                      | 否   | —      |
| `size`                          | `'sm' \| 'md' \| 'lg' \| 'xl' \| undefined` | 否   | `'md'` |
| `centered`                      | `boolean \| undefined`                      | 否   | —      |
| `dirty`                         | `boolean \| undefined`                      | 否   | —      |
| `suppressUnsavedChangesWarning` | `boolean \| undefined`                      | 否   | —      |
| `ariaLabel`                     | `string \| undefined`                       | 否   | —      |

### Events

| 名称             | 参数               |
| ---------------- | ------------------ |
| `update:visible` | `[value: boolean]` |
| `init`           | `[]`               |
| `appear`         | `[]`               |
| `disappear`      | `[]`               |

### Slots

| 名称      | 上下文                                                 |
| --------- | ------------------------------------------------------ |
| `header`  | `() => unknown`                                        |
| `default` | `() => unknown`                                        |
| `footer`  | `(context: { close: () => Promise<void> }) => unknown` |

<!-- component-contract:end -->
