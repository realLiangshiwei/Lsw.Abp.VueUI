# 应用启动

`createAbpApp` 创建注入器、安装 Vue 集成，并等待应用初始化器执行完毕。完成后再挂载页面；路由、权限和本地化都依赖首次应用配置。

## 最小应用

下面几个文件组成应用外壳。示例使用[表单与校验](../utilities/forms)中的表单页面，以及[扩展用户页](../tutorials/extend-users)中的 Identity 配置。

<<< ../../examples/startup.ts

`App.vue` 将当前路由页面放入选定的布局：

<<< ../../examples/App.vue

`routes.ts` 添加业务页面和延迟加载的模块路由：

<<< ../../examples/routes.ts

`provideAbpCore(withOptions({ environment }))` 提供配置与框架服务，`provideAbpRouter` 安装路由和守卫，`provideAbpOAuth` 实现认证契约，`provideAbpThemeBasic` 提供 Bootstrap 主题、布局、通知与错误处理。

## 模块配置

启动时注册来自 `@lsw-abpvue/identity/config` 的 `provideIdentityConfig()`，路由中通过 `lazyRoutes('/identity', ...)` 延迟加载页面。生成的模板会为选定模块完成这两步。

设置模块应先注册 `provideSettingManagementConfig()`，再注册 `provideFeatureManagementConfig()`，让功能模块的贡献者可以使用设置页签树。

## 初始化与失败处理

异步启动工作使用 `provideAppInitializer`。注入服务应在 `await` 之前同步完成，服务工厂自身不发请求、不操作 DOM。

首次后端请求失败时，启动会拒绝，除非应用初始化错误处理器已经处理。生成的模板包含可重试的错误页面，修改启动代码时应保留这一体验。
