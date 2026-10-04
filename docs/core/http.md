# HTTP and errors

`RestService` resolves the API address, applies framework interceptors and returns a promise. Generated proxies call it internally.

```ts
import { inject, RestService } from '@lsw-abpvue/core';

const rest = inject(RestService);
const result = await rest.request<never, { total: number }>(
  { method: 'GET', url: '/api/app/report', params: { year: 2026 } },
  { apiName: 'default' },
);
```

This setup fragment assumes that your backend implements that endpoint. Capture `rest` before asynchronous callbacks; resolve services only inside an injection context.

## Request options

| Option | Behavior |
| --- | --- |
| `apiName` | Select a named API from the environment |
| `signal` | Abort the request |
| `observe: 'response'` | Return status and headers with the body |
| `skipHandleError` | Let the caller handle failure without global reporting |
| `skipAddingHeader` | Omit AJAX, tenant, language and timezone headers |
| `skipAuthorization` | Omit the bearer token and authentication retry |

For external services, choose headers and authentication explicitly. The default AJAX header makes ABP API failures return 401/403 instead of an HTML login redirect.

## Failure handling

`AbpHttpError` retains status, URL, ABP error details and validation errors. A transport failure has status zero. The theme registers handlers for authentication, tenant resolution, validation, ABP errors and other statuses.

Use `useServerValidation(form)` when field-level backend errors should be displayed by a form. Use `skipHandleError` when a caller owns the entire error experience; avoid reporting the same error twice. [Forms](/utilities/forms) and [notifications](/utilities/notifications) describe those interfaces.
