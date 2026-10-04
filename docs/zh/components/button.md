<script setup>
import Example from "../../examples/ButtonExample.vue";
</script>

# AbpButton

`AbpButton` 用于页面和对话框中的操作命令。它使用当前主题，渲染原生按钮，支持加载、禁用、尺寸和图标状态。

## 防止重复保存

把下面的组件复制到页面中。点击 Save 可查看加载状态；示例延迟 800 毫秒后更新本地数据。实际使用时，将延迟替换成业务请求。

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/ButtonExample.vue

## 选择按钮样式

主操作使用 `variant="primary"`，取消使用 `secondary`，破坏性操作使用 `danger`。`outline` 保留语义颜色并改为描边样式。工具栏适合 `size="sm"`，醒目的入口适合 `lg`。`block` 填满可用宽度。

默认类型是 `button`。在表单中使用 `type="submit"`，在表单上处理 `submit`，这样输入框中的 Enter 也能提交。保存函数仍要检查进行中的请求，因为其他代码也可能调用它。

## 加载和失败

`loading` 显示加载图标、禁用原生按钮并设置 `aria-busy`。`disabled` 只阻止操作，不显示进度。通过 `finally` 恢复加载状态，只在请求成功后清空表单。按钮本身不发请求、不报告失败，也不负责删除确认。

## 图标与名称

Bootstrap Icons 可通过 `icon-class="bi bi-plus"` 使用；自定义图标使用 `icon` 插槽。装饰性图标应对屏幕阅读器隐藏。只有图标的按钮必须提供 `aria-label`，提示气泡不能代替可访问名称。加载时默认文字仍然显示，自定义图标插槽需要自行处理加载外观。

参见[表单提交](/zh/utilities/forms)、[确认操作](/zh/utilities/notifications)和[页面工具栏](/zh/components/page-toolbar)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpButton.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称        | 类型                                                                                                                   | 必填 | 默认值      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- | ---- | ----------- |
| `type`      | `'button' \| 'submit' \| 'reset' \| undefined`                                                                         | 否   | `'button'`  |
| `variant`   | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| 'light' \| 'dark' \| 'link' \| undefined` | 否   | `'primary'` |
| `size`      | `AbpSize \| undefined`                                                                                                 | 否   | `'md'`      |
| `outline`   | `boolean \| undefined`                                                                                                 | 否   | —           |
| `loading`   | `boolean \| undefined`                                                                                                 | 否   | —           |
| `disabled`  | `boolean \| undefined`                                                                                                 | 否   | —           |
| `iconClass` | `string \| undefined`                                                                                                  | 否   | —           |
| `block`     | `boolean \| undefined`                                                                                                 | 否   | —           |
| `ariaLabel` | `string \| undefined`                                                                                                  | 否   | —           |

### Events

| 名称    | 参数                  |
| ------- | --------------------- |
| `click` | `[event: MouseEvent]` |

### Slots

| 名称      | 上下文          |
| --------- | --------------- |
| `default` | `() => unknown` |
| `icon`    | `() => unknown` |

<!-- component-contract:end -->
