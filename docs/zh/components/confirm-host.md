<script setup>
import Example from "../../examples/NotificationHostsExample.vue";
</script>

# AbpConfirmHost

`AbpConfirmHost` 渲染 ConfirmationService 的当前问题，也用于模态框丢弃更改确认。

## 等待结果

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/NotificationHostsExample.vue

只有 ConfirmationStatus.confirm 才允许继续修改。取消返回 reject；允许关闭时，Esc 或背景关闭返回 dismiss。二者都应停止操作，不能按返回字符串的真假值判断。

## 宿主位置

应用布局已经提供确认宿主。自定义布局或独立视图没有宿主时才增加，不要在每个嵌套组件都挂载。宿主与服务必须使用同一注入器，才能共享问题与结果状态。

## 配置问题

根据含义使用 warn、info、success、error 或 show。选项可设置本地化按钮文字、隐藏按钮、指定图标，或禁止背景和 Esc 关闭。提供清晰的问题与标题，记录名称通过本地化参数传入。

服务一次只保留一个问题，新问题会 dismiss 前一个，注入器销毁也会结束未回答问题。等待确认后才调用删除 API，避免在处理中打开无关的第二个确认。参见[模态框关闭](/zh/components/modal)和[通知](/zh/utilities/notifications)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpConfirmHost.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

没有组件专有参数。

### Events

没有声明组件专有事件。

### Slots

没有命名插槽。

<!-- component-contract:end -->
