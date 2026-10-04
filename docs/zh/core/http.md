# HTTP 请求

`RestService` 是生成代理使用的传输入口。它选择 API 地址、执行框架拦截器、过滤未提供的查询参数，并返回 Promise。

## 请求响应正文

在 setup 中同步获取服务，再在事件处理函数中复用。GET `/api/app/report` 由[后端示例](/zh/tutorials/backend-examples)提供，登录用户需要 `AbpIdentity.Users`。

~~~ts
import { inject, RestService } from '@lsw-abpvue/core';

const rest = inject(RestService);
async function loadReport(year: number): Promise<{ total: number }> {
  return rest.request<never, { total: number }>(
    { method: 'GET', url: '/api/app/report', params: { year } },
    { apiName: 'default' },
  );
}
~~~

第一个泛型是请求正文类型，第二个是 Promise 返回值类型。POST、PUT 需要提供正文类型和 `body`。生成服务已经填写这些类型。

## 请求选项

| 选项 | 默认值 | 行为 |
| --- | --- | --- |
| `apiName` | `default` | 使用 `environment.apis[name].url` |
| `observe` | `body` | `response` 返回状态、响应头与正文 |
| `signal` | 无 | 取消正在进行的请求 |
| `skipHandleError` | `false` | 不报告给全局错误链，Promise 仍然拒绝 |
| `skipAddingHeader` | `false` | 跳过 AJAX、租户、语言和时区头 |
| `skipAuthorization` | `false` | 跳过 Bearer 令牌及认证刷新、重试 |

`skipAddingHeader` 本身不会关闭 OAuth。访问无关的外部服务时，要明确配置请求头与认证两个选项。绝对 HTTP 地址不使用 API 基地址；相对地址与选定 API 地址拼接。

`params` 会移除 `undefined` 和空字符串。默认也移除 `null`；`withOptions({ environment, sendNullsAsQueryParam: true })` 会将 null 作为字符串 `"null"` 发送。数组和对象的编码应遵循业务端点的查询契约。

## 读取状态与响应头

~~~ts
import { inject, RestService, type HttpResponse } from '@lsw-abpvue/core';

const rest = inject(RestService);
const response = await rest.request<never, HttpResponse<{ total: number }>>(
  { method: 'GET', url: '/api/app/report', params: { year: new Date().getUTCFullYear() } },
  { observe: 'response' },
);
console.log(response.status, response.headers.get('ETag'), response.body.total);
~~~

这是 setup 片段。`observe` 改变运行时返回值，因此返回值泛型应为 `HttpResponse<T>`，而不是 `T`。

## 取消请求

列表查询应传递框架提供的 `AbortSignal`；独立异步任务可以使用 `AbortController`。[列表](/zh/utilities/lists)和[请求生命周期](/zh/utilities/requests)介绍取消与过期结果保护。仅使用 Promise，不能阻止旧请求覆盖新数据。

## 请求失败

失败时抛出 `AbpHttpError`，包含 `status`、`method`、`url`、`headers`、解析后的 ABP `error` 信封与 `raw`。网络失败和取消等传输错误的状态码为 `0`。错误信封可以包含 `code`、`message`、`details` 和 `validationErrors`。

进入 catch 时，主题可能已经展示错误。此处适合保留对话框和恢复加载状态；主动绕过全局处理时再自行显示消息，避免重复提示。

需要将保存错误回填字段时，在提交前注册 `useServerValidation(form)`，见[表单](/zh/utilities/forms)。定制全局处理方式见 [HTTP 错误处理](/zh/core/http-errors)。
