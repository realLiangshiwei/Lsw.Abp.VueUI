# 环境配置

运行时配置用于让同一个前端构建部署到不同环境。

## 优先级

从高到低：`/dynamic-env.json`（不可用时尝试 `/getEnvConfig`）、构建时 `VITE_API_URL` / `VITE_AUTH_URL` / `VITE_APP_URL`、`src/env.ts` 中传入的默认值。

```json
{
  "production": true,
  "application": { "name": "BookStore", "baseUrl": "https://app.example.com" },
  "apis": { "default": { "url": "https://api.example.com" } },
  "oAuthConfig": {
    "issuer": "https://auth.example.com",
    "clientId": "BookStore_App",
    "scope": "offline_access BookStore",
    "responseType": "code",
    "redirectUri": "https://app.example.com",
    "postLogoutRedirectUri": "https://app.example.com"
  }
}
```

## 字段

| 字段 | 含义 |
| --- | --- |
| `apis.default.url` | 默认 API 地址 |
| `apis.<name>.url` | 模块远程服务对应的命名 API |
| `application.name` | 应用名称与标题 |
| `application.baseUrl` | 前端部署地址，也用于域名租户识别 |
| `oAuthConfig.issuer` | 认证服务器 |
| `oAuthConfig.responseType` | code 选择授权码流程，其他值选择本地密码流程 |
| `oAuthConfig.scope` | 请求范围，offline_access 用于刷新令牌 |
| `metadataUrl` / `metadataSeed` | 可覆盖发现地址或后台协议端点 |

默认本地化资源由后端应用配置决定，不能仅凭应用名称推断。环境对象的字段与 Angular 保持相近，但迁移时应核对支持选项与地址。

## 开发代理

生成项目在开发模式下将默认 API 请求通过同源 `/api` 代理，发现和令牌等协议请求使用 `/.well-known`、`/connect` 代理。真实 issuer 保留，浏览器登录和退出仍跳转认证服务器。命名 API 保留明确配置的地址，生产构建使用真实服务地址。

## 部署与端口

`dynamic-env.json` 应返回 JSON，不能被 SPA 回退成 HTML。JSON 解析失败会使用后续默认值。前端端口必须匹配后端 CORS、登录和退出回调。初次接入时使用 `switch-ui --port` 配置，已有 Vue 前端改端口时同步其配置与后端，再运行 DbMigrator 和 doctor。
