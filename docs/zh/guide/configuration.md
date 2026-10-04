# 配置

后端 URL 的来源，以及如何不重新构建就修改它。

## 三层优先级

```
public/dynamic-env.json     read at runtime, before the application starts
  ↓ (or /getEnvConfig, for a backend that serves the configuration itself)
VITE_API_URL, VITE_AUTH_URL, VITE_APP_URL
  ↓
src/env.ts                  what this build was born with
```

运行时文件与应用一起提供，不编译进构建，使相同产物能部署开发、预发布和生产环境。修改文件即可切换环境配置。

```json
{
  "apis": { "default": { "url": "https://api.example.com" } },
  "application": { "name": "BookStore", "baseUrl": "https://app.example.com" },
  "production": true,
  "oAuthConfig": {
    "issuer": "https://auth.example.com",
    "clientId": "BookStore_App",
    "scope": "offline_access BookStore",
    "responseType": "code",
    "redirectUri": "https://app.example.com",
    "postLogoutRedirectUri": "https://app.example.com",
    "silentRefreshRedirectUri": "https://app.example.com/silent-renew.html"
  }
}
```

::: warning 部署中常见的两项问题
以 application/json 提供 dynamic-env.json，不能被返回 index.html 的 SPA 回退捕获。收到 HTML 后会回退下一配置层，看起来像忽略配置。
:::

## 字段含义

| 字段 | 用途 |
| --- | --- |
| apis.default.url | 默认后端，生成服务未指定其他 API 时使用 |
| apis.&lt;name&gt;.url | 独立模块宿主，name 对应 remoteServiceName |
| application.name | 应用名称与浏览器标题 |
| application.baseUrl | 前端地址，用于构造重定向 URI |
| oAuthConfig.issuer | 身份服务器，单宿主方案中与 API 相同 |
| oAuthConfig.responseType | code 使用身份服务器登录；其他值使用本地账户表单和密码流程 |
| oAuthConfig.scope | offline_access 允许使用刷新令牌 |
| oAuthConfig.metadataUrl | 可选发现 URL，开发模板指向同源代理 |
| oAuthConfig.metadataSeed | 可选的令牌、撤销、用户信息和 JWKS 端点覆盖 |

默认本地化资源来自后端应用配置。为各部署环境配置地址。

## 登录页面选择

responseType: code 使用带 PKCE 的授权码流程：转到身份服务器登录，再返回。这是默认流程，也是生产环境应使用的流程。

其他值使用账户模块自己的表单和资源所有者密码流程。用户留在应用，但应用需要处理密码。两类流程均处理 ABP 的两步验证与锁定响应。

## 环境变量

开发时可使用 .env.development：

```bash
VITE_API_URL=https://localhost:44305
VITE_AUTH_URL=https://localhost:44305
VITE_APP_URL=http://localhost:4200
```

只填充 dynamic-env.json 未提供的值，运行时部署文件优先。

## 开发代理

生成的 Vite 应用通过自身源的 /api 发送默认 API 请求。发现、令牌、撤销、用户信息和 JWKS 请求使用前端 /.well-known、/connect 代理。真实 issuer 保持不变，浏览器登录、退出重定向仍去授权服务器。

VITE_API_URL 与 VITE_AUTH_URL 分别指定代理目标，具名 API 保留显式 URL。转换仅在 Vite 开发时运行，生产使用真实服务地址。

## 修改端口

首次接入使用 switch-ui --port &lt;n&gt;。已有 Vue 应用须同时修改 Vite、运行时配置、后端 CORS 与种子回调 URL，再运行 DbMigrator 和 doctor。
