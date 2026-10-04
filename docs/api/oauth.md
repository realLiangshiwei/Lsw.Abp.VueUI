# @lsw-abpvue/oauth

Public exports grouped by import entry. Value exports exist at runtime; type exports are used with `import type`. Source links lead to their declarations.

This reference follows **main**. The published npm channel is **alpha**; consult [versions and compatibility](/release/compatibility) before relying on a change that has not been published.

## Import

```ts
import { authInterceptor } from '@lsw-abpvue/oauth';
```

## `@lsw-abpvue/oauth`

| Export                      | Kind  | Source                                                                                                                        |
| --------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| `authInterceptor`           | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/interceptors/auth.interceptor.ts)      |
| `OAuthEndpointMissingError` | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/models/errors.ts)                      |
| `AuthTokens`                | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/models/oauth.ts)                       |
| `DiscoveryDocument`         | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/models/oauth.ts)                       |
| `TokenResponse`             | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/models/oauth.ts)                       |
| `provideAbpOAuth`           | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/providers/oauth.provider.ts)           |
| `withTokenStorage`          | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/providers/oauth.provider.ts)           |
| `OAuthFeature`              | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/providers/oauth.provider.ts)           |
| `AbpOAuthService`           | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/abp-oauth.service.ts)         |
| `AuthNavigationService`     | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/auth-navigation.service.ts)   |
| `AuthStateService`          | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/auth-state.service.ts)        |
| `RememberMeService`         | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/remember-me.service.ts)       |
| `TokenEndpointService`      | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/token-endpoint.service.ts)    |
| `TokenStateStore`           | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/services/token-state-store.ts)         |
| `AuthCodeFlowStrategy`      | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/strategies/auth-code-flow.strategy.ts) |
| `LOGIN_ROUTE`               | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/strategies/password-flow.strategy.ts)  |
| `PasswordFlowStrategy`      | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/strategies/password-flow.strategy.ts)  |
| `AuthFlowStrategy`          | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/strategies/strategy.ts)                |
| `decodeJwt`                 | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/utils/jwt.ts)                          |
| `completeSilentRenew`       | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/oauth/src/utils/silent-renew.ts)                 |
