# 依赖注入

ABP 注入器支持类型化 Token、分层解析、多提供者，以及组件之外的回调解析。它与 Vue 原生 provide/inject 是两个接口。

## 定义服务

```ts
import { defineService, inject, RestService } from '@lsw-abpvue/core';

export const ReportService = defineService('ReportService', () => {
  const rest = inject(RestService);
  return {
    get: (year: number) => rest.request<never, { total: number }>({
      method: 'GET', url: '/api/app/report', params: { year },
    }),
  };
});
```

假定后端实现该端点。工厂在对应注入器中解析并缓存，不使用装饰器。工厂不应发请求或操作 DOM，启动工作放入 provideAppInitializer。

## 使用与覆盖

setup 或服务工厂中使用 `inject(Token)`，持有注入器的回调使用 `injector.get(Token)`。上下文在 await 后不保留，异步操作前先获取服务。

提供者支持 useValue、useFactory、useClass、useExisting。`defineToken<T>(name, { multi: true })` 定义多值 Token，提供者的 multi 设置必须匹配。

`provideAbp([...])` 在 setup 中创建子注入器供后代使用。同一个 setup 里直接 inject 仍读父注入器，需要使用返回的子注入器读取本组件覆盖项。

## 唯一包实例

Token 是 Symbol，两个物理 core 副本代表不同标识，可能导致注入失败。包间使用 peer dependency，组件库不要再次打包 core。精确 API 见 [core](/zh/api/core)。
