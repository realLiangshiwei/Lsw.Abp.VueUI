# 列表与偏好

使用 `useListService` 连接提供分页结果的后端。页面拥有控件、列、选择与 CRUD；组合式函数协调查询状态、取消和保存的偏好。

## 准备后端与页面

按[后端示例](/zh/tutorials/backend-examples)提供 `/api/app/documentation-catalog`。这个教学端点支持 `filter`、`category`、`minPrice`、`sorting`、`skipCount` 和 `maxResultCount`，返回 `{ items, totalCount }`。使用拥有 `AbpIdentity.Users` 权限的用户登录。

创建 `src/pages/CataloguePage.vue`，复制以下代码。端点来自配套示例，不是每个 ABP 应用自带的接口。保留生成应用中的 Core 与 Basic Theme 提供者；布局已经渲染确认与通知宿主。

<<< ../../examples/ListExample.vue

按后端教程注册 `/catalogue`，增加 `BookStore::Books` 本地化文本。其他标签使用英文常量以便观察查询流程；实际应用可通过计算属性本地化它们。

## 搜索、组合与重置筛选

输入 Search 会修改 `list.filter`，触发防抖查询。Category 与 Minimum price 是额外的 ref，查询函数将它们加入请求，监听器调用 `get()` 重置页码。三个条件在后端统计和分页前共同生效。只过滤下载的一页会造成总数错误。

创建分类为 Reference、价格为 20 的 Atlas，以及分类为 Fiction、价格为 5 的 Novel。搜索 Atlas、选择 Reference 并把最低价格设为 10，应只显示 Atlas。Reset filters 清空所有条件并回到第零页。清空最低价格表示没有价格条件，零则是实际条件值。

`hookToQuery` 会发起首次请求，不要再通过 `onMounted` 初始化同一查询。Vue 批处理同步状态变化，查询监听器协调最终状态。查询函数收到的 `AbortSignal` 会传给 RestService。

## 服务端排序与分页

表格发出排序变化，不重排服务端记录。示例在注册查询**之前**监听 `sortKey`、`sortOrder` 和每页数量，并重置页码，避免使用旧页偏移请求新的排序。

页码从零开始：第 1 页、每页 10 条发送 `skipCount: 10`。分页总数绑定服务端 `totalCount`，不能使用 `items.length`。只有后端支持列 id 时才开启排序。示例允许 name、price，并用 id 作为次级排序以稳定分页。

第三次点击排序会清除方向。查询中只有字段名、没有方向时，配套后端按升序处理。请明确自己的后端默认行为，不要假定控件会排序数据。

## 刷新、重试与空结果

`get()` 回到第零页，`getWithoutPageReset()` 重复当前查询。Refresh 与 Retry 使用后者。查询失败保留之前的记录并暴露 `error`；成功但没有匹配项时显示 empty 插槽。

停止示例后端并点击 Refresh 可以查看失败状态，重新启动后点击 Retry。通用 HTTP 处理器也可能报告异常；页面消息解释列表状态，而不是重复同一异常。不要把错误转换为空的成功响应。

## 新增、编辑与删除

New book 重置页面拥有的表单。Edit 先读取完整详情，再打开对话框。保存前验证，忙碌状态阻止重复提交；失败保留草稿和字段错误。Cancel 调用模态框页脚受保护的关闭方法。

新增后用 `get()` 回首页，编辑后用 `getWithoutPageReset()` 保留当前页。当前筛选继续生效，所以新增或修改成功的记录可能不再匹配。

Delete 先确认、等待服务端完成，再从选择中移除 id。新总数不再覆盖当前页时，页面退回最后一个有效页并查询。删除失败保留记录和选择。使用每页 5 条、共 6 条匹配记录，进入第二页并删除最后一条，可以检查是否回到第一页。

## 选择与保存的偏好

`record-key="id"` 保证排序后的身份稳定。选择 id 与查询状态分开：示例在筛选变化时清空，翻页时保留。表头复选框只改变当前可见页的 id。批量端点仍须重新授权每个 id。

`persistKey: 'Documentation.Catalogue'` 按用户保存每页数量和排序，不保存筛选、页码或选择。调整数量和排序后刷新页面检查恢复；退出只清理当前用户的偏好。页面结构变化时迁移已有值或使用新的稳定 key，不要使用翻译后的标签。

`AbpExtensibleTable` 可以共用列表 key 保存隐藏列。普通业务页面拥有自己的列，不需要扩展容器。

## 排查查询

页面结果不正确时检查实际 URL 与响应，确认后端接受全部条件，在 skip/take 前排序，并且 totalCount 描述筛选后的集合。检查只有一份查询注册，查询函数和参数计算没有递归调用 `get()`。

参见[数据表格](/zh/components/data-table)、[分页](/zh/components/pagination)、[表单](/zh/utilities/forms)和[请求取消](/zh/utilities/requests)。
