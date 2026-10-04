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
