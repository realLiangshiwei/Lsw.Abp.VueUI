# 个人资料与设置页签

模块需要在本地个人资料或设置页增加面板时，可以贡献页签。每个面板是 Vue 组件，自行负责加载、验证和保存。

## 增加两个组件

创建 src/components/ContactProfileTab.vue。下面通过实际 Account 资料代理编辑电话，保留其他资料字段、额外属性和并发戳，不把整个资料替换成只含电话的请求体。

<<< ../../examples/ContactProfileTab.vue

创建 src/components/PrintingTab.vue。使用[后端示例](/zh/tutorials/backend-examples)中的完整 PrintingSettingsAppService，实现 GET／PUT `/api/app/printing-settings`，接收与返回 `{ copies: number }`，通过持久化设置存储保存当前用户覆盖，本教程使用 `AbpIdentity.Users` 权限。这是应用端点，不是设置管理的内置端点。

<<< ../../examples/PrintingTab.vue

加载失败禁用 Save 并提供 Retry，保存失败保留输入与字段错误，面板卸载时通过 AbortSignal 结束请求。

## 注册面板

创建 src/custom-tabs.ts，把两个导入调整为 components 目录：

<<< ../../examples/custom-tabs.ts

在已有启动 providers 中，将 customTabs 放到模块配置和默认页签注册之后。OAuth 后保留 provideAccountConfig()，让 My account 使用本地目的地；account 的 provideManageProfileTabs() 注册资料与密码默认页签；provideSettingManagementConfig() 注册设置。保留已有 account、setting-management 懒加载路由。注册页签不会创建路由或安装后端端点。

在应用资源中增加 BookStore::Contact、BookStore::Printing。打开 /account/manage 或 /setting-management，选择新增页签。

## 稳定标识、顺序与权限

| 属性 | 用途 |
| --- | --- |
| name | 稳定标识，默认也作为本地化 key |
| text | 资料页签必填，设置页签可选的标签覆盖 |
| component | 选中后挂载的面板 |
| order | 排序，默认零 |
| requiredPolicy | 可见所需权限 |
| visible / invisible | 额外条件 / 明确隐藏 |
| parentName | 分组时的父项标识 |

通过 `tabs.patch(name, { order: 10 })` 调整，通过 `tabs.remove([name])` 删除，删除也会移除子项。改显示文字时保持 name 稳定。隐藏不影响后端能力，端点仍要授权。

## 刷新与未保存状态

资料示例把响应写回 ManageProfileStateService，让其他面板看到最新共享资料。有效设置或当前用户字段被其他界面读取时，保存后刷新应用配置。保存设置覆盖和读取有效值是两个请求；保存成功但刷新失败时，反馈应明确区分。

切换面板可能卸载组件。模态框 dirty 关闭保护不会自动保护页面或页签导航。需要保护的面板应自行增加导航策略，或在受保护对话框中编辑，不能假定页签列表自动保存。

## 范围与检查

贡献只影响本地页面，不修改独立授权服务器的 /Account/Manage。需要检查实际 My account 提供者与目的地。

检查首次加载、失败重试、无效份数、保存失败、拒绝权限、保存后重进、其他页签读取新资料及租户有效设置。参见[认证](/zh/guide/authentication)、[表单](/zh/utilities/forms)和[设置](/zh/core/settings-features)。
