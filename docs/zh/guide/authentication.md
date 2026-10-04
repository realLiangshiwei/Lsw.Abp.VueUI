# 认证

注册 `provideAbpOAuth()`，实现 core 定义的 `AuthService` Token。`oAuthConfig.responseType` 决定认证流程。

## 带 PKCE 的授权码流程

`responseType: 'code'` 时，Login 跳转授权服务器，由服务器验证用户，再携带授权码返回已注册的前端回调。前端交换令牌并刷新应用配置。生产浏览器应用使用此流程。

登录、注册、忘记密码入口转交授权服务器；重置密码链接仍可到本地账户路由。退出走授权服务器的结束会话流程，返回 `postLogoutRedirectUri`；只清理本地令牌无法结束服务器会话。

## 本地密码流程

非 code 配置下，账户登录页收集凭据并调用令牌端点。后端必须允许该授权方式及本地登录。后端支持时，`TwoFactorRequiredError` 可以触发账户页的第二步验证，可用发送方式取决于后端能力。

本地退出清理令牌和当前用户列表偏好，重新加载匿名配置并返回首页。

## 使用服务

```ts
import { AuthService, inject } from '@lsw-abpvue/core';

const auth = inject(AuthService);
const login = () => auth.navigateToLogin('/books');
const logout = () => auth.logout();
```

事件处理函数调用这些方法。`isAuthenticated` 是 computed ref，`isInternalAuth` 表示本地认证，`login(params)` 用于本地凭据表单。

## My account

用户菜单调用 `NAVIGATE_TO_MANAGE_PROFILE`。OAuth 默认打开 `{issuer}/Account/Manage` 并带返回地址。在 OAuth 之后注册 `provideAccountConfig()` 会覆盖该 Token，打开本地 `/account/manage`。生成模板选择账户模块时包含这一覆盖。应用按需求注册个人资料行为，它与授权码流程的退出跳转分别配置。

## 令牌与租户切换

`TokenStorage` 默认使用浏览器存储，可通过 `withTokenStorage` 替换。401 可以触发一次共享的令牌刷新与重试，续期失败会结束会话。切换租户会使前一租户的令牌失效并刷新配置。

issuer、客户端 ID、scope、登录回调和退出地址应匹配数据库中的 OpenIddict 客户端，见[环境配置](./configuration)和[多租户](/zh/core/multi-tenancy)。

## 配置完整 Code 流程

issuer 使用浏览器能访问的授权服务器，clientId 使用已种子的公开 SPA 客户端，responseType 为 code，scope 包含 API 范围和后端支持刷新时的 offline_access。redirectUri、postLogoutRedirectUri 必须与客户端注册完全一致，包括协议、主机、端口与路径。浏览器应用不能保存客户端密钥。

OAuth 应放在有意覆盖导航 token 的模块之前。先核对[运行时配置](/zh/guide/configuration)，修改种子客户端地址后重新运行 DbMigrator。开发代理能转发发现和 token 请求，不能让重定向的浏览器访问原本不可达的授权服务器。

## 登录、资料与退出分别检查

| 命令 | 检查 |
| --- | --- |
| navigateToLogin('/books') | 服务器登录、回调处理与允许的返回路径 |
| My account | 本地 account 提供者或授权服务器 /Account/Manage |
| logout() | end-session 重定向与退出返回地址 |
| Refresh | 客户端、grant、scope 的刷新支持及过期行为 |

修改资料目的地不会把 Code 退出变成本地清 Token。退出一个应用不一定结束其他应用会话，需要确认授权服务器会话策略。

## 认证状态与 API 授权

isAuthenticated 是 UI 的 computed 状态，grantedPolicies 来自刷新后的后端配置。登录与获得策略权限是两项检查，已登录用户也可能收到 403。菜单隐藏拒绝命令，路由守卫阻止进入页面，后端执行最终授权。

不要在模块导入时解码一次 Token 并缓存假定权限。登录、退出、租户切换更新配置并驱动响应式检查，应使用服务状态，不另建脱节的用户标志。

## 按失败阶段排查

| 症状 | 检查 |
| --- | --- |
| 返回地址被拒绝 | 种子客户端精确回调及数据库重新种子 |
| 登录服务器打不开 | 实际 issuer 可达性、证书，而不是只看 API 代理 |
| 回调后反复登录 | state/回调处理、scope、运行时地址 |
| My account 去错误主机 | NAVIGATE_TO_MANAGE_PROFILE 顺序与 account 路由 |
| 登录后 API 失败 | apiName 地址、audience/scope、租户与 CORS |
| 退出返回错误页面 | postLogoutRedirectUri 注册与 end-session 响应 |

检查浏览器实际重定向和失败请求，避免同时改多个环境值。密码流需要后端支持，不能作为 Code 配置错误的后备方案。
