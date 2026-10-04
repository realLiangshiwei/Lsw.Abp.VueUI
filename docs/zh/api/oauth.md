# @lsw-abpvue/oauth

按导入入口列出公开导出。值导出存在于运行时；类型导出使用 `import type`。源码链接指向对应声明。

本参考跟随 **main**。npm 已发布通道是 **alpha**；使用尚未发布的变更前请查看[版本与兼容性](/zh/release/compatibility)。

## 导入

```ts
import { authInterceptor } from '@lsw-abpvue/oauth';
```

## `@lsw-abpvue/oauth`

| 导出                        | 类别 | 源码                                                                                                                        |
| --------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------- |
| `authInterceptor`           | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/interceptors/auth.interceptor.ts)      |
| `OAuthEndpointMissingError` | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/models/errors.ts)                      |
| `AuthTokens`                | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/models/oauth.ts)                       |
| `DiscoveryDocument`         | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/models/oauth.ts)                       |
| `TokenResponse`             | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/models/oauth.ts)                       |
| `provideAbpOAuth`           | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/providers/oauth.provider.ts)           |
| `withTokenStorage`          | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/providers/oauth.provider.ts)           |
| `OAuthFeature`              | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/providers/oauth.provider.ts)           |
| `AbpOAuthService`           | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/abp-oauth.service.ts)         |
| `AuthNavigationService`     | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/auth-navigation.service.ts)   |
| `AuthStateService`          | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/auth-state.service.ts)        |
| `RememberMeService`         | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/remember-me.service.ts)       |
| `TokenEndpointService`      | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/token-endpoint.service.ts)    |
| `TokenStateStore`           | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/token-state-store.ts)         |
| `AuthCodeFlowStrategy`      | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/strategies/auth-code-flow.strategy.ts) |
| `LOGIN_ROUTE`               | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/strategies/password-flow.strategy.ts)  |
| `PasswordFlowStrategy`      | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/strategies/password-flow.strategy.ts)  |
| `AuthFlowStrategy`          | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/strategies/strategy.ts)                |
| `decodeJwt`                 | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/utils/jwt.ts)                          |
| `completeSilentRenew`       | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/utils/silent-renew.ts)                 |
