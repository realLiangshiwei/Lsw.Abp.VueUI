# 包结构

包之间通过 peerDependencies 依赖。DI token 是 Symbol，依赖树中两份物理 core 副本会为同一服务产生不同 Symbol，造成难以定位的注入失败。

## 分层

| 包 | 允许依赖 |
| --- | --- |
| utils | 无 |
| core | vue、vue-router（peer）、utils |
| oauth | core、oidc-client-ts |
| theme-shared | **仅 core**，禁止 UI 库，包括 reka-ui |
| components | core、theme-shared（peer）、@tanstack/vue-table |
| theme-basic | theme-shared、account-core、reka-ui、配套 @internationalized/date、Bootstrap CSS |
| 业务模块 UI | 上述层与平级模块，禁止主题实现 |

## 次级入口

```
@lsw-abpvue/identity          the pages, lazily
@lsw-abpvue/identity/config   the menu entries, at startup
@lsw-abpvue/identity/proxy    the generated services
```

三类入口用于不同时间。Identity config 注册导航，不加载页面；其他 config 入口可能包含懒加载页签，选择加载内容时查看包入口。

abpv create-lib 为自定义模块生成相同的三个入口。

@lsw-abpvue/core/object-extensions 是无 Vue 或 DI 导入的纯映射入口。运行时组件与 Node CLI 共用它，诊断与控件使用同一属性映射。

## 消费者要求

仅 ESM，设置 type: module，声明由 vue-tsc 生成。moduleResolution 的 bundler、node16、nodenext 均可解析；CI 在工作区外安装打包产物并编译检查。

## SSR 约束

core 通过 WindowService、DocumentService、StorageService、CookieService 访问浏览器环境；单例状态放在服务实例，不放模块级变量。目前没有服务端渲染器，这些约束保留后续支持的可能性。
