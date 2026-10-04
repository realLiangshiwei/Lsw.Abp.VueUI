# 选择服务与组合式函数

服务 Token 在 setup 或提供者工厂中注入。组合式函数通常获取这些服务，或创建属于当前 Vue 作用域的状态。

| 任务 | API | 行为说明 |
| --- | --- | --- |
| 启动应用 | `createAbpApp`、`provideAbpCore`、`withOptions` | [应用启动](/zh/development/startup) |
| 创建或替换服务 | `defineService`、`defineToken`、`inject`、`provideAbp` | [依赖注入](/zh/concepts/dependency-injection) |
| 读取框架状态 | `useConfigState`、`ConfigStateService` | [应用状态](/zh/concepts/state) |
| 读取用户 | `useCurrentUser` | [当前用户](/zh/core/current-user) |
| 登录与退出 | `AuthService`、`provideAbpOAuth` | [认证](/zh/guide/authentication) |
| 翻译 | `useLocalization`、`$t`、`LocalizationService` | [本地化](/zh/concepts/localization) |
| 检查权限 | `usePermission`、`PermissionService` | [权限](/zh/concepts/permissions) |
| 读取设置与功能 | `useSetting`、`useFeature` | [设置与功能](/zh/core/settings-features) |
| 选择租户 | `useMultiTenancy`、`SessionStateService` | [多租户](/zh/core/multi-tenancy) |
| 调用后端 | `useRest`、`RestService` | [HTTP](/zh/core/http) |
| 注册导航 | `RoutesService`、`lazyRoutes` | [路由](/zh/concepts/routes-and-menu) |
| 查询列表 | `useListService`、`useListPreferences` | [列表](/zh/utilities/lists) |
| 验证字段 | `useAbpForm`、`Validators`、`useValidationMessages`、`useServerValidation` | [表单](/zh/utilities/forms) |
| 控制异步工作 | `useLatest`、`useDebounceFn`、`useSubscriptions` | [请求](/zh/utilities/requests) |
| 显示反馈 | `useToaster`、`useConfirmation`、`usePageAlert` | [通知](/zh/utilities/notifications) |
| 替换 UI | `ReplaceableComponentsService`、`provideThemeComponents` | [替换组件](/zh/customization/replacement) |
| 扩展模块页面 | `useExtensions`、`EntityProp`、`FormProp`、`EntityAction`、`ToolbarAction` | [页面扩展](/zh/concepts/extensions) |

## 提供者与 Token

提供者函数放入 `createAbpApp` 的 `providers` 数组。Token 标识服务或配置值，替换 Token 会影响从对应注入器解析的使用者，`EnvironmentProviders` 用于组合注册。

## 类型与导入

导出名称、泛型、参数和返回值可以通过 IDE 的补全与跳转查看。本文帮助选择工具；具体注册、组合与错误处理见上表的指南。

使用公开包入口，不要导入内部文件。类型使用 `import type` 或行内 `type` 修饰符。应用预设可以自动导入常用运行时工具，可复用库建议显式导入。

站点随 `main` 更新，使用示例前请比较已安装版本与[发布记录](/zh/release/releases)。自己的业务 DTO 来自自己的后端，不能假定与示例字段相同。
