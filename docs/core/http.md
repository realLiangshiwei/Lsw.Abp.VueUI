# HTTP requests

`RestService` is the transport used by generated proxies. It selects the API base URL, applies framework interceptors, removes absent query parameters and returns a Promise.

## Request a response body

Resolve the service synchronously in setup, then reuse it in event handlers. Install GET `/api/app/report` from [the backend examples](/tutorials/backend-examples) and sign in with `AbpIdentity.Users`.

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

The first generic is the request body; the second is what the Promise resolves to. For POST or PUT, supply the body type and `body`. Generated services already supply these types.

## Request and transport options

| Option | Default | Behavior |
| --- | --- | --- |
| `apiName` | `default` | Selects `environment.apis[name].url` |
| `observe` | `body` | `response` returns status, headers and body |
| `signal` | None | Cancels pending work |
| `skipHandleError` | `false` | Prevents reporting to the global error chain; the Promise still rejects |
| `skipAddingHeader` | `false` | Skips AJAX, tenant, language and timezone headers |
| `skipAuthorization` | `false` | Skips Bearer token attachment and authentication refresh/retry |

Setting `skipAddingHeader` does not skip OAuth by itself. When calling an unrelated external origin, explicitly choose both header and authentication options. An absolute HTTP URL bypasses the configured API base; a relative URL is joined to it.

`params` drops `undefined` and empty strings. By default it also drops `null`; `withOptions({ environment, sendNullsAsQueryParam: true })` sends null as the string `"null"`. Arrays and objects must follow your endpoint's query contract.

## Read status and headers

~~~ts
import { inject, RestService, type HttpResponse } from '@lsw-abpvue/core';

const rest = inject(RestService);
const response = await rest.request<never, HttpResponse<{ total: number }>>(
  { method: 'GET', url: '/api/app/report', params: { year: new Date().getUTCFullYear() } },
  { observe: 'response' },
);
console.log(response.status, response.headers.get('ETag'), response.body.total);
~~~

This is a setup fragment. `observe` changes the runtime result, so the result generic must be `HttpResponse<T>` rather than `T`.

## Cancellation

Use the `AbortSignal` passed to a list query, or create an `AbortController` for component-owned work. [List queries](/utilities/lists) and [request lifecycle](/utilities/requests) describe cancellation and stale-result protection. A Promise alone does not stop an earlier request from overwriting newer data.

## Failure behavior

Failures reject with `AbpHttpError`. It exposes `status`, `method`, `url`, `headers`, the parsed ABP `error` envelope and `raw`. Transport failures, including cancellation, have status `0`. The envelope can contain `code`, `message`, `details` and `validationErrors`.

The theme can already have reported an error by the time your catch block runs. Catch it to keep your dialog open or restore loading state; show a second message only when you intentionally bypass the global handler.

For a field-level save failure, connect `useServerValidation(form)` before submitting. See [forms](/utilities/forms). For a custom global policy, continue with [HTTP error handling](/core/http-errors).
