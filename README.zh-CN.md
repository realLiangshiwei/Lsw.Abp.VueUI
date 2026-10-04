# Lsw.Abp.VueUI

[English](README.md) | [简体中文](README.zh-CN.md)

[![npm alpha](https://img.shields.io/npm/v/%40lsw-abpvue%2Fcli/alpha?label=npm%20alpha&style=flat-square)](https://www.npmjs.com/package/@lsw-abpvue/cli) [![许可证：MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

**Lsw.Abp.VueUI** 为基于 [ABP Framework](https://abp.io/) 的应用提供 Vue 3 前端，包含认证、业务模块、Bootstrap 主题和 CLI。

项目的功能与扩展点对标 ABP 官方 Angular UI，实现采用 Vue Composition API。直接使用 ABP 已有的 API，无需安装额外的后端包。

这是一个**非官方社区项目**，与 Volosoft 无关联。目前通过 **`alpha`** 标签提供预发布版本。

## 快速开始

### 创建新的解决方案

安装 CLI 并创建解决方案：

```bash
dotnet tool install -g Volo.Abp.Studio.Cli
npm install -g @lsw-abpvue/cli@alpha
abpv new Acme.BookStore -d mongodb
```

`abpv` 使用 ABP 官方 CLI 的 `no-ui` 模板创建后端，再添加 Vue 前端。目录结构与 ABP Angular 方案保持一致，前端目录使用 `vue/`：

```text
Acme.BookStore/
├── aspnet-core/
│   ├── src/     # ABP 后端项目
│   └── test/    # 后端测试
└── vue/         # Vue 前端
```

### 接入已有 ABP 解决方案

为已有解决方案添加 Vue 前端，同时保留现有 UI：

```bash
abpv switch-ui --mode keep
```

## 功能

- **认证**：带 PKCE 的授权码流程、令牌续期、登录和退出。
- **授权**：路由、菜单、组件和操作的权限检查。
- **多租户**：租户选择和携带租户信息的 API 请求。
- **本地化**：后端本地化资源、语言切换和 RTL 布局。
- **应用服务**：依赖注入、配置、HTTP 服务和列表管理。
- **校验与反馈**：表单校验、服务端错误、确认提示和通知。

## 主题

内置 **Basic Theme**，使用 **Bootstrap 5** 样式和 **Reka UI** 控件，提供响应式导航、明暗主题、RTL 支持和通用表单控件。业务模块通过主题契约使用控件，应用可以提供自己的主题。

## 业务模块

以下 ABP 开源模块的 UI 均以独立包提供：

| 模块     | 包                                  | 功能                               |
| -------- | ----------------------------------- | ---------------------------------- |
| 账号     | `@lsw-abpvue/account`               | 登录、注册、密码找回和个人资料管理 |
| 身份管理 | `@lsw-abpvue/identity`              | 用户、角色及其权限                 |
| 权限管理 | `@lsw-abpvue/permission-management` | 权限管理弹窗                       |
| 租户管理 | `@lsw-abpvue/tenant-management`     | 租户、连接字符串和租户功能         |
| 功能管理 | `@lsw-abpvue/feature-management`    | 功能管理弹窗                       |
| 设置管理 | `@lsw-abpvue/setting-management`    | 设置页面                           |

## 模板与开发工具

### 应用模板

应用模板包含 Vue 3、TypeScript、Vue Router 和 Vite，并已接入认证、模块路由和运行时配置。常用 Vue 与 ABP 组件及 API 支持**自动按需导入**。

### `abpv` CLI

`abpv` 和 `abpvue` 调用同一个 CLI。

| 命令          | 作用                                |
| ------------- | ----------------------------------- |
| `new`         | 创建 ABP 后端和 Vue 前端            |
| `switch-ui`   | 为已有解决方案添加 Vue 前端         |
| `proxy`       | 生成类型化服务、DTO、校验器和权限名 |
| `generate`    | 为后端实体生成 CRUD 页面            |
| `add-package` | 添加模块包，可同时引入源码          |
| `create-lib`  | 创建可复用的模块 UI 包              |
| `doctor`      | 诊断环境、后端和认证配置            |
| `update`      | 更新项目中的 ABP Vue 包             |

## 文档与示例

- [文档站](https://realliangshiwei.github.io/Lsw.Abp.VueUI/zh/)：中英文使用指南、CLI 与组件指南。
- [Playground](playground/)：演示模块 UI 与扩展点的 BookStore 应用。

## 参与贡献

欢迎提交问题、完善文档和发起 Pull Request。请通过 [GitHub Issues](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/issues) 报告问题或提出功能建议。

## 许可证

Lsw.Abp.VueUI 使用 [MIT 许可证](LICENSE)。ABP Framework 及其他依赖保留各自的许可证。
