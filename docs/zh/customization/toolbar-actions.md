# 页面工具栏扩展

工具栏贡献者在模块表格上方添加操作。本例提示当前页的用户数量。

## 定义贡献者

<<< ../../examples/user-toolbar.ts

## 注册到模块路由

将示例保存为 `src/identity-options.ts`，在 `src/routes.ts` 使用导出的选项：

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { userToolbar } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(userToolbar)),
);
~~~

将 `identityRoute` 放入应用路由数组，并保留启动时的 `provideIdentityConfig()`。替换已有 identity 路由，不要为同一前缀注册两份路由。模块配置改变后重启开发服务，再打开 `/identity/users`。


## 当前页与勾选记录

Identity 用户工具栏的类型为 `ToolbarAction<readonly IdentityUserDto[]>`，`data.record` 包含当前页记录，不是勾选记录，也不是跨页的全部查询结果。

按勾选 id 执行批量操作，需要页面拥有的选择状态。自定义组件可以读取页面提供的命令／状态 token，或通过替换、包装页面提供该状态。不能用当前页数组代替勾选 id。

## 打开模态框或执行页面命令

在操作回调中通过 `data.getInjected` 获取页面命令 token。命令负责 visible、dirty、busy 等状态，工具栏操作负责触发。复杂控件可以由自定义页面中的工具栏插槽渲染。

文字、图标与回调操作使用 `ToolbarAction`。需要自定义渲染的控件放入 Vue 工具栏插槽或页面组件。

## 权限与异步状态

`permission` 设置所需策略，`visible` 添加响应式业务条件。操作可以返回 Promise，但防止重复修改、完成后刷新查询，需要页面命令显式管理。

示例计数使用带默认值的本地化 key。将 `BookStore::CurrentPageCount` 与 `BookStore::CurrentPageCountMessage` 添加到后端资源或[前端本地化](/zh/concepts/localization)。

## 检查效果

切换每页条数与页码后点击操作，数量应跟随当前页；没有策略权限的用户不应看到该操作。自己的批量操作还应分别检查零勾选和翻页后的选择状态。

另见[扩展行为](/zh/customization/extension-behavior)与[组件替换](/zh/customization/replacement)。


## 调用业务服务

安装[后端示例](/zh/tutorials/backend-examples)中的 ReportAppService。GET `/api/app/report?year=2026` 返回 `{ total: number }`，本教程使用 `AbpIdentity.Users` 权限。复制两个文件，在已有 Identity 路由选项传入 reportToolbar，增加 BookStore::Report/ReportTotal 资源。服务负责防重复请求，贡献器通过 getInjected 触发。它统计当前租户指定年份的教学目录记录，不使用 Users 的勾选行。

<<< ../../examples/report-service.ts

<<< ../../examples/report-toolbar.ts
