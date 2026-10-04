<script setup>
import Example from "../../examples/NotificationHostsExample.vue";
</script>

# AbpToastHost

`AbpToastHost` 渲染 ToasterService 创建的通知。没有匹配且已挂载的宿主时，服务调用不会显示通知。

## 显示并指定通知容器

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/NotificationHostsExample.vue

通知指定 containerKey 为 example，宿主指定对应的 container-key。默认应用布局已经挂载普通宿主，不要每个页面再增加一个，否则可能重复显示。

## 生命周期与归属

life 指定自动消失时间，sticky 保留到主动关闭，closable、tapToDismiss 控制关闭方式。提供 id 后可以引用该通知，只有明确需要复用时才设置稳定 id。

消息和标题是本地化参数，插值通过 messageLocalizationParams、titleLocalizationParams 传入。简短操作反馈适合通知，与内容相关的持续问题适合[页面提示](/zh/utilities/page-alerts)。

错误通知不是后端验证绑定，字段错误应显示在表单中，已处理的 HTTP 失败应避免重复报告。参见[通知](/zh/utilities/notifications)和[HTTP 错误](/zh/core/http-errors)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpToastHost.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称           | 类型                  | 必填 | 默认值 |
| -------------- | --------------------- | ---- | ------ |
| `containerKey` | `string \| undefined` | 否   | —      |

### Events

没有声明组件专有事件。

### Slots

没有命名插槽。

<!-- component-contract:end -->
