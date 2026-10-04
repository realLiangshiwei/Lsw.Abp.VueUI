# 请求生命周期

在 setup 中解析服务，再在事件与异步操作中使用已经保存的服务。ABP 注入上下文是同步的。

## 只采用最新结果

`useLatest<T>()` 在新的 `run` 开始时取消上一次操作，将它提供的信号传入请求：

```ts
import { inject, RestService, useLatest } from '@lsw-abpvue/core';

const rest = inject(RestService);
const latest = useLatest<string[]>();
const search = (term: string) => latest.run(signal =>
  rest.request<never, string[]>(
    { method: 'GET', url: '/api/app/search', params: { term } },
    { signal },
  ),
);
```

被替代的操作返回 `undefined`，当前操作的错误仍会拒绝。只有结果已定义时才赋值。这适合搜索建议；`useListService` 已经处理了列表查询的协调。

## 防抖与清理

`useDebounceFn(callback, milliseconds)` 返回可调用函数，并提供 `.cancel()`，所属作用域销毁时会取消计时器。

`useSubscriptions()` 使用 `.add()` 收集取消订阅函数，作用域销毁时统一执行，`.clear()` 可以提前清理。语言或会话监听返回的取消订阅函数应注册到这里，避免页面离开后仍保留回调。
