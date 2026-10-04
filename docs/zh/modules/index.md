# 模块 UI

提供六个 ABP 开源模块的 UI。暴露前端路由或对话框前，应安装对应后端模块，应用还需要 core、认证和已注册主题。

| UI | 包 | 接入方式 |
| --- | --- | --- |
| [账户](./account) | `@lsw-abpvue/account` | 页面与资料页签 |
| [身份管理](./identity) | `@lsw-abpvue/identity` | 用户与角色路由 |
| [权限管理](./permission-management) | `@lsw-abpvue/permission-management` | 提供者对话框 |
| [租户管理](./tenant-management) | `@lsw-abpvue/tenant-management` | 租户路由 |
| [功能管理](./feature-management) | `@lsw-abpvue/feature-management` | 提供者对话框与设置贡献 |
| [设置管理](./setting-management) | `@lsw-abpvue/setting-management` | 设置路由与页签 |

`account-core` 包含账户与主题共用的租户和资料服务。内置服务与 DTO 位于公共 `/proxy` 入口，提供配置入口的模块通过 `/config` 完成轻量启动注册。

## 接入模式

启动时注册配置提供者，模块路由延迟加载。CLI 模板接入所选模块，单独安装包不会自动创建路由或菜单。

## 定制

模块表格和表单支持贡献者。每个页面使用稳定的组件 key，通过路由选项注册列、行操作、工具栏与表单字段的调整。

前端页面覆盖开源后端可用端点，不包含商业身份操作和资源权限页面。应按各模块 API 与权限确认能力范围。
