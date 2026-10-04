# 浏览器与服务端边界

框架服务使用平台抽象，不假定浏览器全局对象一定存在。

| 服务 | 职责 |
| --- | --- |
| `WindowService` | Window、地址与浏览器导航 |
| `DocumentService` | Document 与 DOM 访问 |
| `StorageService` | 浏览器存储与服务端安全行为 |
| `CookieService` | Cookie 读写 |

可复用框架代码应注入对应服务。浏览器外可能没有 `nativeWindow` 或原生 document，使用浏览器专有能力前需要检查。

## 作用域与状态

可变状态放在服务实例或 Vue 作用域中。模块级可变状态可能在服务端渲染中跨请求共享，也可能在多个应用实例之间泄漏。

Token 是依赖物理包实例共享的 Symbol，组件库应避免打包另一份 core。同级 ABP Vue 包使用 peer dependency，由应用提供唯一实例。

## SSR 支持边界

平台安全服务和可替换的令牌存储是服务端渲染的基础能力。生成应用仍是客户端 SPA，这些抽象不等于完整 SSR 模板。SSR 宿主需要提供按请求隔离的环境、传输和认证存储，防止用户状态跨请求共享。
