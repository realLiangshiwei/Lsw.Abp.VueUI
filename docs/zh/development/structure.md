# 项目结构

标准解决方案分开存放后端与 Vue 前端：

```text
Acme.BookStore/
├── aspnet-core/
│   ├── src/
│   └── test/
└── vue/
    ├── src/
    │   ├── main.ts
    │   ├── startup.ts
    │   ├── env.ts
    │   ├── routes.ts
    │   ├── pages/
    │   └── proxy/
    ├── public/dynamic-env.json
    ├── abp-auto-imports.ts
    └── package.json
```

## 日常修改的文件

| 文件 | 职责 |
| --- | --- |
| `main.ts` / `startup.ts` | 创建应用、注册服务和模块配置 |
| `routes.ts` | Vue 路由与业务菜单元数据 |
| `env.ts` | 内置环境默认值 |
| `public/dynamic-env.json` | 部署时读取的运行时配置 |
| `pages/` | 自己的 Vue 业务页面 |
| `proxy/` | 生成的业务服务与 DTO |
| `abp-auto-imports.ts` | 常用 API 与组件的构建时导入 |

默认模板包含欢迎页和选定的模块 UI；只有 `--sample-crud` 才加入 Books、Authors 示例。`new --no-backend` 仅创建前端，文件直接写入指定输出目录。

## 包入口

模块包提供主 UI 入口、轻量的 `/config` 配置入口和 `/proxy` 类型化服务入口。启动时注册配置，访问模块时再加载页面。应用自己的代理放在 `src/proxy`，内置模块的代理已经包含在对应包中。

继续阅读[应用启动](/zh/development/startup)、[API 代理](/zh/guide/backend)和[包依赖关系](/zh/concepts/packages)。
