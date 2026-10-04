# HTTP 错误处理

传输层报告请求失败，`theme-shared` 决定错误如何展示。Basic Theme 注册默认错误链。传输异常、字段错误与业务通知分别由对应层处理。

## 默认执行顺序

**数值越小越先执行，第一个匹配的处理器接管错误。**

| 优先级 | 处理器 | 行为 |
| --- | --- | --- |
| 10 | `AuthenticationErrorHandler` | 将支持的 401 交给认证流程 |
| 20 | `TenantResolveErrorHandler` | 提示租户解析失败并清除选择 |
| 30 | `ValidationErrorHandler` | 将验证错误交给当前注册的表单 |
| 40 | `AbpFormatErrorHandler` | 展示 ABP 错误信封，有 details 时使用对话框 |
| 50 | `StatusCodeErrorHandler` | 为支持的 HTTP 状态显示错误页 |
| 99 | `UnknownStatusCodeErrorHandler` | 处理剩余错误 |

验证响应也是 ABP 错误信封。字段处理器排在信封处理器之前，且仅在有表单监听时接管；没有表单时，仍会展示后端错误消息。

## 添加处理器

创建 `src/rate-limit-handler.ts`，内容如下：

<<< ../../examples/custom-error-handler.ts

示例在优先级 35 处理 HTTP 429，位于字段验证之后、通用错误信封之前。依赖在工厂中获取，后续回调复用已取得的服务。

将提供者加入应用已有的 providers：

~~~ts
import { rateLimitProvider } from './rate-limit-handler';

const providers = [
  // Existing core, router, OAuth and theme providers...
  rateLimitProvider,
];
~~~

将数组传给 `createAbpApp`。在启动、解析错误链之前完成根级注册；之后在子注入器添加提供者，不会重建已经初始化的根级错误链。

`canHandle` 应准确匹配目标错误。始终返回 true 会阻止后续处理器执行。`handle` 可以返回 Promise，完成后不会继续向后传递错误。

## 单个请求自行处理

~~~ts
import { AbpHttpError, inject, RestService } from '@lsw-abpvue/core';

const rest = inject(RestService);
async function saveName(name: string): Promise<string | undefined> {
  try {
    await rest.request<{ name: string }, unknown>(
      { method: 'POST', url: '/api/app/product', body: { name } },
      { skipHandleError: true },
    );
    return undefined;
  } catch (error) {
    if (error instanceof AbpHttpError) return error.error?.message ?? 'Save failed';
    throw error;
  }
}
~~~

调用方负责显示返回的消息。`skipHandleError` 会关闭该请求的全部全局报告，包括自动字段错误分发；需要字段消息时自行回填。它不会把失败转成成功。

## 错误页

`ErrorPageService.show({ status, title, details, showHome })` 设置共享错误页状态，`clear()` 清除状态。Basic Theme 在布局中渲染错误页；自定义布局需要提供对应渲染。进入异步回调之前先获取服务。

通过 `provideErrorHandler` 注册类型化的 `AbpErrorHandler`。`canHandle(error)` 选择处理的请求，`handle(error)` 决定反馈方式。调整处理链后，应检查匹配、不匹配与表单验证失败三类响应。

## 检查结果

让业务端点实际返回 429，确认只出现一次通知。检查带字段错误的 400 仍会回填表单、401 仍会进入认证流程。状态码不能完全识别 ABP 业务错误，设计匹配条件时还应检查信封与响应头。
