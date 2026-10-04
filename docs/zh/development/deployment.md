# 应用部署

将 Vue 前端构建成静态应用，部署到 Web 主机。ABP 后端和认证服务器仍是独立服务。

## 运行时配置

部署前在 `public/dynamic-env.json` 中设置生产 API、issuer 和前端地址，也可以替换已部署的文件。设置 `production: true`，授权码流程使用 `responseType: 'code'`。

Vite 开发代理不会进入生产构建，应配置浏览器可访问的真实服务地址。[环境配置](/zh/guide/configuration)介绍了命名 API 与端点覆盖。

## Web 主机与后端

| 要求 | 原因 |
| --- | --- |
| 前端路由回退到 `index.html` | 直接访问 `/identity/users` 时能够加载 SPA |
| `dynamic-env.json` 按 JSON 返回 | HTML 回退内容不能提供环境配置 |
| 注册准确的登录和退出回调地址 | OpenIddict 会校验回调 |
| 后端 CORS 允许前端来源 | 浏览器请求需要访问 API |
| 修改种子客户端地址后重跑 DbMigrator | 配置修改不会自动更新数据库中的客户端 |

部署到子路径时，Vite base、路由 history、运行时配置位置和回调地址应一致。需要在该路径验证直接链接和认证返回。

## 对外开放前

使用实际部署配置检查登录、刷新、My account、退出、权限、租户行为和直接链接。授权码流程的 My account 通常位于认证服务器，浏览器也必须能访问该服务器。

前端环境文件公开可读，不应包含秘密。
