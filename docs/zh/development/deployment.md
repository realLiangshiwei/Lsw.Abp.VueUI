# 部署应用

前端是静态 SPA，API 与授权服务器独立部署。先确定前端 base 路径，再对齐资源、运行时配置、路由和认证回调。

## 根路径运行时配置

部署到 `https://app.example.com` 时，把以下 `dynamic-env.json` 放在 `index.html` 旁：

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

将客户端和 API scope 替换为后端实际种子配置。浏览器应用不放客户端密钥，文件公开可读。生产构建不包含 Vite 开发代理。

## 正确提供路由与资源

在 HTTPS 入口代理之后使用以下配置，并调整文档根目录、主机名和 MIME 文件位置：

<<< ../../examples/deployment/root.nginx

`/assets/` 和文件扩展名使用 `try_files ... =404`，缺失脚本、图片或 JSON 返回 404，只有应用路径回退到 index.html。运行时配置不缓存，HTML 重新验证，带指纹的 Vite 资源可以长期缓存。

示例监听 8080，假定反向代理终止 HTTPS。nginx 自行终止 TLS 时，另行配置 HTTPS 监听与证书。实际回调注册应使用自己的主机名。

## 部署到子路径

部署到 `https://app.example.com/portal/` 时，保留 Vite 插件，在 `vite.config.ts` 添加 `base: '/portal/'`。`src/main.ts` 中运行时配置与路由历史使用相同 base：

```ts
import { loadRuntimeConfig } from '@lsw-abpvue/core';
import { provideAbpRouter, withRouterHistory } from '@lsw-abpvue/core/router';
import { createWebHistory } from 'vue-router';

const environment = await loadRuntimeConfig({
  url: `${import.meta.env.BASE_URL}dynamic-env.json`,
  defaults: defaultEnvironment,
});
const router = provideAbpRouter(routes, withRouterHistory(createWebHistory(import.meta.env.BASE_URL)));
```

替换生成的运行时配置调用和路由提供者，保留 defaultEnvironment／routes 导入，将 environment 传给 Core。不要创建第二个路由器。同一应用仍在本地开发时，保留生成的仅开发环境转换。

dynamic-env.json 使用完整前端 base：

```json
{
  "production": true,
  "application": { "name": "BookStore", "baseUrl": "https://app.example.com/portal/" },
  "apis": { "default": { "url": "https://api.example.com" } },
  "oAuthConfig": {
    "issuer": "https://auth.example.com",
    "clientId": "BookStore_App",
    "scope": "offline_access BookStore",
    "responseType": "code",
    "redirectUri": "https://app.example.com/portal/",
    "postLogoutRedirectUri": "https://app.example.com/portal/"
  }
}
```

将构建产物复制到 `/srv/www/portal/`，使用：

<<< ../../examples/deployment/subpath.nginx

文件系统和 URL 共用 portal 目录。本地 Logo URL、已配置的 silent-renew 文件也需要 `/portal/`。不要让其他应用的回退处理回调或运行时配置。

## 同步后端配置

CorsOrigins 配置前端**源** `https://app.example.com`，不带 `/portal/`。OpenIddict 客户端注册精确的登录、退出 **URL**，包含 `/portal/` 及预期的结尾斜杠。RootUrl／RedirectAllowedUrls 设置与种子客户端重定向记录用途不同，应检查实际客户端，不能假定一个设置会同步全部记录。

修改种子 URL 后运行 DbMigrator。有独立授权服务器时，更新并启动该宿主与 API。My account 的本地 Account 或授权服务器目的地取决于提供者顺序，应单独验证。

## 验证部署结果

| 请求或操作 | 预期结果 |
| --- | --- |
| 直接打开 `/identity/users` 或 `/portal/identity/users` | SPA 使用正确资源 base 加载 |
| 运行时 JSON | 返回部署地址的 JSON，不是 HTML |
| 缺失 `/assets/not-found.js` 或 portal 对应路径 | 404，不是 index.html |
| 登录 | 授权服务器返回已注册前端 URL |
| 登录后刷新 | 恢复会话和已授予策略 |
| My account／Logout | 正确目的地与退出返回 |
| 筛选、保存、重新打开记录 | API 契约与验证保持兼容 |

前端构建成功不能证明 CORS 或回调注册正确。逐阶段检查浏览器请求，不要同时修改多个环境值。

## 发布与回滚

构建一次，部署静态产物，并提供各环境自己的 dynamic-env.json。保持 API scope、客户端契约与后端兼容。构建时 `.env` 不能替代部署文件。

回滚时一起恢复兼容的资源、运行时配置和后端契约。只还原 JSON 无法修复不兼容 DTO。参见[配置](/zh/guide/configuration)、[认证](/zh/guide/authentication)与[排查](/zh/guide/troubleshooting)。
