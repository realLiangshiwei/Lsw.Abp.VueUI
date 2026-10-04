# 依赖注入

ABP 注入器用于共享服务、配置 Token 和组件之外的回调。服务 Token 来自 `@lsw-abpvue/core`，注意区分它的 `inject` 与 Vue 中的同名函数。

## 定义服务

创建 `src/report-service.ts`。安装[后端示例](/zh/tutorials/backend-examples)中的 ReportAppService，使用拥有 `AbpIdentity.Users` 的用户登录；GET `/api/app/report?year=2026` 返回 `{ total: number }`：

<<< ../../examples/report-service.ts

`defineService` 返回带默认工厂的类型化 Token。首次解析时执行工厂，结果缓存在根注入器中。多个使用者共享这个结果，子作用域显式覆盖 Token 时除外。`ServiceOf` 可取得服务类型，不必再手写一份接口。

工厂负责构造服务，不应直接发请求或操作页面。启动工作放入初始化器，页面请求放入调用者的操作。

## 在异步操作前获取依赖

在组件 setup 或其他服务工厂中：

~~~ts
import { inject } from '@lsw-abpvue/core';
import { ReportService } from '../report-service';

const reports = inject(ReportService);
async function load(year: number): Promise<number> {
  return (await reports.get(year)).total;
}
~~~

同步获取依赖，await 后不会保留注入上下文。已经持有注入器的回调可以使用 `injector.get(ReportService)`；扩展回调提供 `data.getInjected` 来完成同样的解析。

## 提供配置与替换服务

`defineToken` 描述值，不要求内置实现：

~~~ts
import { defineToken } from '@lsw-abpvue/core';

export const REPORT_YEAR = defineToken<number>('REPORT_YEAR');
const reportYearProvider = { provide: REPORT_YEAR, useValue: 2026 };
~~~

将提供者加入已有的 `createAbpApp` providers 数组。没有提供者或默认工厂时，解析 Token 会抛错。使用导出的同一个 Token；描述相同的另一个 Token 不代表同一个值。

| 提供方式 | 用途 |
| --- | --- |
| `useValue` | 已有配置值或服务实例 |
| `useFactory` | 构造值，在工厂中获取依赖 |
| `useClass` | 构造类实现 |
| `useExisting` | 让另一个 Token 解析为同一服务 |

覆盖实现需要满足 Token 的完整服务类型。覆盖改变之后的解析结果，不会改写使用者已经获取的实例。

## 创建组件作用域

~~~ts
import { provideAbp } from '@lsw-abpvue/core';
import { ReportService } from '../report-service';

const pageInjector = provideAbp([
  { provide: ReportService, useValue: { get: async () => ({ total: 0 }) } },
]);
const pageReports = pageInjector.get(ReportService);
~~~

在 setup 中调用，覆盖供本组件后代使用，随作用域销毁。同一个 setup 直接 `inject(ReportService)` 仍读取父注入器；本组件需要覆盖项时，通过返回的注入器读取。这个示例提供预览数据，不访问后端。

## 初始化与清理

`provideAppInitializer` 注册启动工作，应用会等待返回的 Promise。初始化器中仍应在 await 前获取依赖。订阅需要显式建立，服务拥有的订阅、计时器或连接通过 `onServiceDestroy` 清理。应用状态不应放在模块级可变变量中。

多值 Token 将提供者收集为数组，Token 的 multi 选项与各提供者的 `multi` 标记必须一致。拦截器和错误处理器优先使用对应注册函数。

## 包实例与问题排查

Token 使用 Symbol 标识。UI 包应解析到同一份共享包实例，组件库通过 peer dependency 引用它们，避免再次打包。

缺少提供者时检查导出的 Token、所属配置、启动顺序与解析作用域。注入器已销毁时，应取消超出页面生命周期的回调。相关生命周期见[应用启动](/zh/development/startup)、[测试](/zh/development/testing)与[扩展行为](/zh/customization/extension-behavior)。
