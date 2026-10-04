# HTTP 与错误处理

`RestService` 解析 API 地址、执行框架拦截器并返回 Promise。生成的代理在内部调用它。

```ts
import { inject, RestService } from '@lsw-abpvue/core';

const rest = inject(RestService);
const result = await rest.request<never, { total: number }>(
  { method: 'GET', url: '/api/app/report', params: { year: 2026 } },
  { apiName: 'default' },
);
```

这是 setup 中的片段，假定后端已经实现该端点。异步回调前先保存 `rest`，服务解析只能在注入上下文内进行。

## 请求选项

| 选项 | 行为 |
| --- | --- |
| `apiName` | 选择环境配置中的命名 API |
| `signal` | 取消请求 |
| `observe: 'response'` | 同时返回状态、响应头和正文 |
| `skipHandleError` | 由调用方处理失败，不进入全局报告 |
| `skipAddingHeader` | 不添加 AJAX、租户、语言和时区头 |
| `skipAuthorization` | 不添加 Bearer 令牌，也不触发认证重试 |

访问外部服务时，应明确选择请求头和认证行为。默认 AJAX 头使 ABP API 失败返回 401/403，而非 HTML 登录重定向。

## 错误处理

`AbpHttpError` 保留状态码、URL、ABP 错误详情和验证错误。传输失败的状态码为零。主题注册认证、租户解析、验证、ABP 错误及其他状态的处理器。

表单需要展示后端字段错误时使用 `useServerValidation(form)`。调用方完全负责错误体验时使用 `skipHandleError`，避免重复报告。[表单](/zh/utilities/forms)和[通知](/zh/utilities/notifications)介绍了相关接口。
