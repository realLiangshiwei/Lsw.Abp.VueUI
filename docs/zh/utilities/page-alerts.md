<script setup>
import Example from '../../examples/PageAlertsExample.vue';
</script>

# 页面提示

PageAlertService 用于需要留在页面内容附近的消息，例如目录加载失败或需要注意的提示。已完成操作的简短反馈适合通知。

## 显示、替换与移除

<ClientOnly><DocsDemo :example="Example" note="演示使用独立的本地提示状态。" /></ClientOnly>

<<< ../../examples/PageAlertsExample.vue

相同 id 替换已有提示，不重复追加。不指定 id 时，show 返回生成的 id。恢复后或所属页面卸载时移除它。无关组件不要直接 clear()，否则也会删除其他组件的提示。

## 渲染与作用域

usePageAlert() 来自 theme-shared，Basic Theme 渲染器 AbpPageAlerts 来自 theme-basic，自定义主题使用自己的实现。默认 Basic 应用布局已经显示页面提示，普通页面不要再加第二个渲染器。独立示例没有布局，所以自己添加。

状态属于注入器。页面卸载不会自动销毁根服务，显式清理可以避免下一条路由继续显示页面专属消息。独立作用域视图可以在视图注入器提供服务，并使用对应渲染器。

## 消息与恢复

severity 支持 neutral、info、success、warning、error。title、message 是本地化参数，分别有插值数组。dismissible 默认 true，关闭消息不等于重试请求。

Retry 应靠近受影响操作，恢复成功后才移除提示。表单成员错误仍显示在字段里，参见[HTTP 失败](/zh/core/http-errors)、[通知](/zh/utilities/notifications)和[表单验证](/zh/utilities/forms)。
