# Angular API 对照

标识可以复用，运行时返回类型和组件代码需要适配。下表覆盖常用公共 API，行为见相关指南，精确签名见包参考。

| Angular 概念 | Vue API | 适配 |
| --- | --- | --- |
| 应用启动 | createAbpApp | 完成后再挂载 |
| Core 配置 | provideAbpCore(withOptions(...)) | 提供者注册 |
| InjectionToken | `defineToken<T>` | 类型化 Symbol |
| Injectable 服务 | defineService | 工厂与推断类型 |
| inject | core 的 inject | 同步注入上下文 |
| 组件 providers | provideAbp | 后代子注入器 |
| DestroyRef | onServiceDestroy | 服务清理 |
| 配置快照与 Observable | getOne、getDeep | ComputedRef，value 读快照 |
| REST Observable | RestService.request | Promise，signal 取消 |
| 本地化管道 | $t | 响应式模板翻译 |
| instant/get | t、tr | 字符串、ComputedRef |
| 权限指令 | AbpPermission | 条件渲染组件 |
| 授权策略查询 | isGranted、isGrantedRef | 布尔值、ComputedRef |
| loadChildren | lazyRoutes | 异步路由工厂 |
| resolve | withResolvers | 等待路由初始化 |
| 路由作用域 | AbpRouterOutlet | 路由提供者 |
| 动态布局 | AbpDynamicLayout | 路由布局元数据 |
| 可替换组件 | ReplaceableComponentsService | 相同公共 key |
| ListService | useListService | Vue 作用域状态 |
| hookToQuery | hookToQuery | 返回 items、totalCount、error，状态在 list |
| 响应式表单 | useAbpForm | 控件值与验证器 |
| TemplateRef | 作用域插槽或 Vue 组件 | 无 Angular 模板实例 |
| 属性和操作类 | 相同公共类名 | Vue 取值与组件 |
| 贡献者回调 | 贡献者映射 | 相同 key 结构，适配 Observable |
| 通知与确认 | useToaster、useConfirmation | 主题无关服务，确认返回 Promise |
| 登录与退出 | AuthService | 流程控制跳转 |
| 代理 schematics | abpv proxy | TS 服务与 DTO |
| 组件库 schematics | abpv create-lib | 独立包骨架 |
| 包升级 | abpv update | 版本修改与已注册迁移 |

## 需要核对的行为

- 权限表达式支持 AND、OR 和括号。
- 取值文本按文本显示，富单元格使用组件。
- 域名租户查找失败阻止启动，切换租户使不匹配令牌失效。
- 编辑请求保留未显示控件对应的扩展属性。
- 主题契约没有 UI 库依赖，选定主题提供实现。
- 普通业务生成页面不注册模块扩展点。

迁移这些区域前阅读[依赖注入](/zh/concepts/dependency-injection)、[扩展](/zh/concepts/extensions)、[认证](/zh/guide/authentication)和[列表](/zh/utilities/lists)。参考描述当前实现，不表示包含所有商业 Angular UI 能力。
