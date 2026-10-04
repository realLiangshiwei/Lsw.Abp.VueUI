# Request lifecycle

Resolve services during setup, then use the captured service in events and asynchronous work. ABP's injection context is synchronous.

## Latest result

`useLatest<T>()` cancels the previous operation when a new `run` begins. Pass its signal into your request:

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

A superseded operation resolves to `undefined`. Errors from the current operation still reject. Only assign a result when it is defined. This pattern is useful for search suggestions; `useListService` already coordinates list query requests.

## Debounce and cleanup

`useDebounceFn(callback, milliseconds)` returns a callable function with `.cancel()`. It cancels its timer when the owning scope is disposed.

`useSubscriptions()` collects unsubscribe functions with `.add()` and runs them on scope disposal; `.clear()` performs the same cleanup early. Register the unsubscribe function returned by a language or session listener to avoid keeping callbacks after a page is gone.
