# HTTP error handling

The transport reports failed requests; `theme-shared` decides how they appear. Basic Theme registers the default chain. Keep transport handling, form errors and application notifications in their respective layers.

## Default handler order

**Smaller priority numbers run first. The first matching handler takes the error.**

| Priority | Handler | Effect |
| --- | --- | --- |
| 10 | `AuthenticationErrorHandler` | Sends a supported 401 to the authentication flow |
| 20 | `TenantResolveErrorHandler` | Reports a tenant resolution failure and clears the selection |
| 30 | `ValidationErrorHandler` | Sends validation errors to an active registered form |
| 40 | `AbpFormatErrorHandler` | Shows the ABP envelope, using a dialog when details exist |
| 50 | `StatusCodeErrorHandler` | Shows the error page for supported HTTP statuses |
| 99 | `UnknownStatusCodeErrorHandler` | Handles the remaining errors |

A validation response is also an ABP envelope. The form handler precedes the envelope handler and only claims the response when a form is listening. Otherwise the user still sees the server message.

## Add a handler

Create `src/rate-limit-handler.ts` with the following content:

<<< ../examples/custom-error-handler.ts

The handler deals with HTTP 429 at priority 35, after form validation and before the generic envelope. It resolves its dependencies during construction; the later callback uses captured services.

Add its provider to the application's existing providers:

~~~ts
import { rateLimitProvider } from './rate-limit-handler';

const providers = [
  // Existing core, router, OAuth and theme providers...
  rateLimitProvider,
];
~~~

Supply this array to `createAbpApp`. Register the handler at root scope before startup resolves the chain. Adding a provider in a later child injector does not rebuild an already initialized root chain.

`canHandle` must be narrow. A handler returning true for every error prevents all later handlers from running. `handle` can return a Promise; returning from it does not resume the chain.

## Handle one request locally

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

The caller must display the returned message. `skipHandleError` suppresses all global reporting for this request, including automatic field-error dispatch; attach field messages yourself if needed. It does not convert a rejection into success.

## Error pages

`ErrorPageService.show({ status, title, details, showHome })` sets the shared error-page state; `clear()` removes it. Basic Theme renders that state in its layout. A custom layout must include its own error rendering. Resolve the service before entering asynchronous callbacks.

Use `provideErrorHandler` to register a typed `AbpErrorHandler`. Its `canHandle(error)` selects the request and `handle(error)` decides the feedback. Check handled, unhandled and validation failures after changing the chain.

## Check the result

Trigger the endpoint's actual 429 response and verify one notification appears. Verify a 400 with field errors still reaches the form and a 401 still reaches authentication. The status code alone does not identify an ABP business error; inspect the envelope and headers when designing a predicate.
