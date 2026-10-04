# 应用测试

使用 Vitest 与 Vue Test Utils 检查组件、服务行为，再连接真实后端检查认证与 CRUD。当前生成应用提供类型检查和构建脚本，没有预置应用级 Vitest 配置。

## 安装与配置

在 `vue/` 中执行：

~~~bash
pnpm add -D vitest @vue/test-utils happy-dom @vitejs/plugin-vue
~~~

添加 `vitest.config.ts`：

~~~ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
    clearMocks: true,
  },
});
~~~

这份独立配置没有使用 CLI 的应用自动导入插件。测试组件使用显式导入；测试依赖自动导入的生成页面时，应在测试配置中复用应用的自动导入设置。单元测试不要执行真实应用的 `main.ts`。

在 package.json scripts 添加 `"test": "vitest"` 和 `"test:run": "vitest run"`。

## 测试响应式权限

创建 `src/components/PermissionButton.vue`：

<<< ../../examples/PermissionButton.vue

在旁边创建 `src/components/PermissionButton.spec.ts`：

<<< ../../examples/PermissionButton.spec.ts

测试创建带 Core 配置的注入器，但不运行应用初始化器，因此不会请求后端。通过公开的 `ABP_INJECTOR_KEY` 挂载组件，从空策略集合开始，授予一个策略后等待 Vue 更新。

断言检查用户能看到的按钮，不检查组件私有属性。一个场景同时覆盖初始无权限和响应式获得权限。

## 替换依赖

测试注入器可以用 `useValue` 替换服务 token：

~~~ts
const injector = createInjector([
  { provide: MyReportService, useValue: { load: async () => ({ total: 3 }) } },
]);
~~~

`MyReportService` 是应用自己导出的 token，替换对象需要满足公共服务类型。通过 `injector.get(Token)` 或 `injector.runInContext(() => ...)` 获取服务。使用 Vue 生命周期的 composable 应在 setup 或 effect scope 中执行，不能作为没有作用域的普通函数调用。

依赖 `$t`、路由或主题宿主的组件，需要使用专门配置提供者的 `createAbpApp`，或在 mount 中提供所需全局属性、插件。使用正常 Core 初始化器启动 createAbpApp 会加载后端配置，应把它作为集成测试，或明确替换后端配置服务。

## 清理与异步处理

先卸载 wrapper，再销毁注入器。移除自行加入 `document.body` 的容器，Teleport 对话框可能遗留到下一条测试。等待 Vue 更新和真实请求 Promise，不用固定 sleep 同步。

单元测试可以替换服务；后端集成测试使用真实端点和专用账户、数据，保留 ABP 验证、租户与并发行为。

## 执行

~~~bash
pnpm test:run
pnpm typecheck
pnpm build
~~~

浏览器检查覆盖登录回调、刷新、My account、退出、无权限用户、租户切换和 CRUD。测试记录使用可识别前缀，并在结束后清理自己创建的数据。

## 框架相关边界

应用测试使用公共注入器与服务 token。主题作者可以使用 `@lsw-abpvue/theme-shared/testing` 的 `runThemeContractTests`，统一检查各控件的键盘操作、焦点与交互行为。

仓库会检查完整文档示例的类型，并执行选定示例；应用仍需运行自己的真实后端和浏览器测试。
