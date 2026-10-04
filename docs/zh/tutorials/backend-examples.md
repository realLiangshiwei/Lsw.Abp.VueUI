# 运行后端示例

一些指南需要框架 API 以外的端点。本页提供配套后端代码，让你在已有 ABP 解决方案中运行目录列表、可扩展模块、打印设置与报表示例。

## 准备解决方案

使用包含 Identity 和 Setting Management 的[新解决方案](/zh/guide/new-solution)或[已有解决方案](/zh/guide/existing-solution)。首次运行使用生成的单宿主开发方案。Application 模块应已依赖相应的 ABP 应用模块，HTTP 宿主应已为该应用程序集创建约定控制器。

示例端点使用已有 `AbpIdentity.Users` 策略，省去权限定义的准备步骤。使用开发管理员登录。实际业务应定义自己的策略，在服务端和 UI 中检查。目录记录由同一租户内获得授权的用户共享，打印设置属于当前用户。

## 添加目录服务

创建 `aspnet-core/src/<Project>.Application/DocumentationSamples/DocumentationCatalogAppService.cs`：

<<< ../../examples/backend/DocumentationCatalogAppService.cs

命名空间可以保留 `DocumentationSamples`，代码不依赖项目特有的基类。自动依赖注册创建单例存储，约定控制器通过 `/api/app/documentation-catalog` 暴露列表、详情、新增、修改与删除。

这是一个小型的**内存教学目录**，初始为空，宿主重启会丢失数据。各租户存储相互隔离，没有数据库事务、并发戳或持久化仓储。实现实际业务实体时，将存储替换为领域仓储并完成 DTO 映射，不要将此例当作持久化存储。

列表先筛选、统计总数，再按 name／price 排序并以 id 稳定同值顺序，最后分页。输入注解提供真实服务端验证。未选择最低价格时省略可选 `minPrice`。

## 添加持久化打印设置

在同一 Application 项目创建 `DocumentationSamples/PrintingSettingsAppService.cs`：

<<< ../../examples/backend/PrintingSettingsAppService.cs

模块程序集会发现设置定义。GET、PUT `/api/app/printing-settings` 使用 ABP 的 `ISettingManager`、当前用户 id 和已有设置存储集成。默认值为 1，接受 1–20。与教学目录不同，这些覆盖值使用方案已配置的持久化设置存储。

刷新应用配置后，可见设置出现在 `Documentation.Printing.DefaultCopies` 中。`POST /api/app/printing-settings/reset` 移除用户覆盖，恢复继承／默认行为。接口不接受调用方指定的用户 id。

## 添加报表端点

创建 `DocumentationSamples/ReportAppService.cs`：

<<< ../../examples/backend/ReportAppService.cs

GET `/api/app/report?year=2026` 统计当前租户在该年创建的目录记录。新记录使用当前 UTC 年份。报表读取服务端数据，不使用 Users 表格的勾选行。宿主重启清空目录，也会重置报表总数。

## 启动与检查

重新构建并启动 HTTP 宿主。如果约定控制器在独立 HTTP API 项目中配置，保留已有 `ConventionalControllers.Create(typeof(<Project>ApplicationModule).Assembly)` 注册；这些类必须位于选定的程序集。不需要 Vue 专用后端包。

打开 Swagger，确认三组路由。缺失时先检查创建控制器使用的程序集和应用模块依赖注册，再排查前端。403 表示当前用户缺少示例策略，不代表路由未生成。

## 添加前端路由

按[列表指南](/zh/utilities/lists)创建 `src/pages/CataloguePage.vue`，在已有 `src/routes.ts` 数组添加：

```ts
{
  path: '/catalogue',
  component: () => import('./pages/CataloguePage.vue'),
  meta: {
    title: 'BookStore::Books',
    requiredPolicy: 'AbpIdentity.Users',
    routes: { name: 'BookStore::Books', order: 3, iconClass: 'bi bi-book' },
  },
}
```

为本地化资源添加 `BookStore::Books`，保留生成的启动、路由和主题提供者。后端 URL 与认证客户端仍使用你自己的方案配置。

[模块组件示例](/zh/components/extensible-table)中的 `CatalogModulePage.vue` 指向同一个目录端点，当前示例已经配置。只含名称的请求使用后端分类与价格默认值。[打印／资料页签](/zh/customization/profile-settings)保留 Account、Setting Management 提供者及路由，自定义页签使用同一示例策略。[报表工具栏](/zh/customization/toolbar-actions)使用本页服务。

## 生成与检查代理

在 `vue/` 中对已启动的后端运行：

```bash
pnpm abpv proxy add --module app --dry-run
pnpm abpv proxy add --module app
```

只有 Node 不信任本地开发证书时才使用 `--insecure`。检查 `src/proxy/generate-proxy.json` 和生成的命名空间索引中的实际名称。使用 RestService 的文档片段不依赖生成路径；[代理指南](/zh/guide/backend)展示如何使用类型化服务、枚举和验证器。

## 验证真实请求

创建六条名称、分类、价格不同的记录。组合筛选、按价格排序、修改每页数量并进入第二页。编辑后检查 GET 详情返回新值。删除后续页的最后一行，确认界面回到有效页。提交空名称或负价格，确认验证响应保留编辑器。

把 Copies 改为 3 并保存，离开再打开页签，GET 应仍返回 3。在 Swagger 直接提交 0，无论前端范围控件如何，服务端都必须拒绝。结束后重置覆盖。检查新增前后的报表总数，以及未登录请求被拒绝。

远程用户选择示例使用 Identity 用户 API（`AbpIdentity.Users`），不使用教学端点。对象扩展持久化见[对象扩展](/zh/customization/object-extensions)，内存目录不验证这项映射。

只删除本次操作创建的记录。不再需要示例端点时，移除这些后端文件。
