# 通知与确认

使用 theme-shared 服务，让通知适配应用选定的主题。Basic Theme 布局已经提供 Toast 和确认框宿主，自定义外壳需要自行渲染它们。

<<< ../../examples/NotificationExample.vue

## Toast

`useToaster()` 提供 `info`、`success`、`warn`、`error`、`show`。调用返回 Toast ID，可用 `remove(id)` 删除，`clear(containerKey?)` 清理一组通知。

默认显示 5000 ms；`life: 0` 持续显示至删除，`sticky` 阻止自动过期。使用 `closable`、`containerKey` 控制关闭与分组。消息和标题接受本地化参数。

## 确认框

`useConfirmation()` 提供对应的严重程度方法，返回 `ConfirmationStatus` 的 Promise。只有 `ConfirmationStatus.confirm` 才继续执行；取消、关闭和隐藏都是未确认结果。

同时只有一个当前确认请求，打开另一个会结束前一个。按钮标签等展示选项通过服务传入，无需绑定到特定主题的对话框。

## 反馈选择

输入错误放在字段旁，操作完成使用 Toast，需要明确决定的操作使用确认框。HTTP 处理器已经报告未处理的请求错误，自定义报告应由调用方明确接管，避免重复。
