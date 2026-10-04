# 列表与偏好

`useListService` 协调筛选、排序、每页条数和从零开始的页码。通过 `hookToQuery` 连接一个后端查询函数，再绑定返回的记录与总数。

<<< ../../examples/ListExample.vue

示例读取 `/api/app/book`，请按业务替换 URL 与记录类型。列标题由调用方本地化。表格通过命名模型更新 `sortKey`、`sortOrder`，本身不会执行服务端排序。

## 刷新与并发

`get()` 回到第零页并重新加载，`getWithoutPageReset()` 刷新当前页。默认防抖 300 ms、每页 10 条。查询变化会取消过期工作，只有最新结果更新列表。查询函数会收到 `AbortSignal`，应传入后端请求。

`requestStatus` 区分 idle、loading、success、error，可用于禁用重复操作和显示加载状态。查询包含 `skipCount`、`maxResultCount`、排序与筛选。

## 保存偏好

给列表设置稳定的 `persistKey`，按用户保存每页条数和排序。`AbpExtensibleTable` 可共用这个 key 保存明确隐藏的列。筛选内容和当前页码不保存，内置模块使用公共组件 key 作为偏好 key。

无效存储值回退到默认值，退出只清理当前用户的偏好。自定义认证的清理方式见[应用状态](/zh/concepts/state)。
