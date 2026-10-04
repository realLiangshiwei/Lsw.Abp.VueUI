# 项目概览

Lsw.Abp.VueUI 为 ABP Framework 应用提供 Vue 3 前端，是采用 MIT 许可证的非官方社区项目，npm 命名空间为 `@lsw-abpvue/*`。

公共模块名称、DTO 字段、本地化 key、权限和可替换组件 key 遵循 ABP Angular 约定，实现使用 Vue Composition API、Promise、Ref 和作用域插槽。

## 提供的能力

- 带 PKCE 的授权码认证与本地密码流程。
- 应用配置、本地化、权限检查、租户解析和类型化 HTTP 服务。
- 使用 Bootstrap 的 Basic Theme，包含响应式导航、暗色模式和 RTL。
- 账户、身份、权限、租户、功能与设置管理 UI。
- 表单、列表查询、反馈，以及可复用模块扩展点。
- 用于新建方案、接入 UI、生成代理、页面和组件库的 CLI。

## 与后端的关系

直接使用解决方案已有的 ABP 端点，无需为前端安装额外后端包，但客户端地址、CORS 和 OpenIddict 种子配置需要匹配。模块页面依赖对应后端模块及权限。

## 阅读顺序

先阅读[快速开始](./new-solution)或[已有方案接入](./existing-solution)。开发部分介绍业务开发，核心功能与工具介绍共享服务，定制部分介绍主题及模块调整，组件与 API 用于查阅。

站点随 `main` 更新，已发布 alpha 包可能稍晚，见[版本与兼容性](/zh/release/compatibility)。Angular 用户可先阅读[迁移说明](/zh/migration/from-angular)。
