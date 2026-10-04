# 从 Angular 迁移

DTO 字段、本地化 key、权限名与可替换组件 key 遵循 Angular 约定。Vue 运行时 API 不同，应复用后端契约并适配组件代码。

## 状态与请求

ConfigStateService 的 getOne、getDeep 返回 computed ref，`.value` 读取快照，模板自动解包，watch 或 computed 跟随变化。REST 和生成服务返回 Promise，取消使用 AbortSignal。

DI 使用类型化 Symbol 和工厂，不使用装饰器。异步边界前获取服务，provideAbp 为后代创建子注入器；同一个 setup 读取覆盖值时用返回的注入器。

## 页面与贡献者

业务页面显式定义列、表单和 CRUD 方法，可复用模块保留五类扩展点。组件标识保留，Observable 回调改成 Promise 或 Ref，Angular 组件类改成 Vue 组件。

valueResolver 返回展示文本，富单元格使用 Vue 组件或作用域插槽，不将旧 HTML 字符串直接带入文本单元格。

## 分步迁移

1. `switch-ui --mode keep` 在 Angular 旁添加 Vue。
2. `proxy add --module app` 生成业务代理，内置模块使用包内代理。
3. 注册启动配置和延迟模块路由。
4. 迁移业务页面，适配可复用模块贡献者。
5. 检查登录、My account、退出、权限、租户和直接链接。
6. 应用迁移完成后再删除旧 UI。

商业模块和后端不支持的操作需要单独实现，见 [API 对照](./api-map)与[兼容性](/zh/release/compatibility)。
