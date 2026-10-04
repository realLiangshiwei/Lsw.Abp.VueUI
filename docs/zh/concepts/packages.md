# 包依赖关系

ABP Vue 包间使用 peer dependency，让应用只保留一份共享包实例。DI Token 为 Symbol，同一个 core 的两个物理副本可能导致解析失败。

## 分层

| 包 | 允许的职责与依赖 |
| --- | --- |
| utils | 无框架依赖的工具 |
| core | Vue、Vue Router 和 utils |
| oauth | core 与 OIDC 实现 |
| theme-shared | 主题契约，只依赖 core，不依赖 UI 库 |
| components | core、theme-shared 与 TanStack 表格 |
| theme-basic | 主题契约、account-core、Reka、日期工具、Bootstrap 与图标 |
| 业务模块 | 上层契约与同级模块，不依赖主题实现 |

## 次级入口

identity 主入口提供页面，identity/config 提供轻量配置，identity/proxy 提供服务和 DTO。create-lib 生成同类结构。core/object-extensions 是不依赖 Vue 或 DI 的纯映射入口，运行时和 CLI 共用。

部分 config 入口会延迟加载页面组件，例如设置页签，因此应以各包实际导出为准，不假定所有 config 都完全没有组件引用。

## 消费方式

包使用 ESM 和类型声明，按声明的 exports 导入。应用使用 Vue 3 与 Vue Router 4，可复用模块不要打包额外的框架副本。平台服务与实例级状态为 SSR 隔离提供基础，当前生成模板仍为客户端 SPA。
