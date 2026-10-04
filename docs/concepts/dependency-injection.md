# Dependency injection

Use the ABP injector for shared services, configuration tokens and callbacks outside components. Service tokens belong to `@lsw-abpvue/core`; distinguish its `inject` from Vue's function with the same name.

## Define a service

Create `src/report-service.ts`. Install ReportAppService from [the backend examples](/tutorials/backend-examples) and sign in with `AbpIdentity.Users`. GET `/api/app/report?year=2026` returns `{ total: number }`:

<<< ../examples/report-service.ts

`defineService` returns a typed token with a default factory. The factory runs on first resolution and its result is cached on the root injector. Multiple consumers share that result unless a child scope explicitly overrides the token. `ServiceOf` exposes the returned service type without duplicating it.

A factory should construct the service, not send requests or manipulate the page. Keep startup work in an initializer and page requests in the caller's operation.

## Resolve before asynchronous work

In component setup or another service factory:

~~~ts
import { inject } from '@lsw-abpvue/core';
import { ReportService } from '../report-service';

const reports = inject(ReportService);
async function load(year: number): Promise<number> {
  return (await reports.get(year)).total;
}
~~~

Capture the dependency synchronously. Injection context is not retained after an await. A callback already holding an injector can call `injector.get(ReportService)`; extension callbacks receive `data.getInjected` for the same purpose.

## Provide configuration and replace services

`defineToken` describes a value without requiring a built-in implementation:

~~~ts
import { defineToken } from '@lsw-abpvue/core';

export const REPORT_YEAR = defineToken<number>('REPORT_YEAR');
const reportYearProvider = { provide: REPORT_YEAR, useValue: 2026 };
~~~

Add the provider to the existing `createAbpApp` providers array. Without a provider or default factory, resolving the token throws. Reuse the exported token; creating a second token with the same description does not identify the same value.

| Provider | Use |
| --- | --- |
| `useValue` | An existing configuration value or service instance |
| `useFactory` | Construct a value, resolving dependencies in the factory |
| `useClass` | Construct a class implementation |
| `useExisting` | Make another token resolve to the same service |

An override must implement the token's complete public service shape. It changes which service resolves; it does not rewrite an instance that a consumer has already captured.

## Create a component scope

~~~ts
import { provideAbp } from '@lsw-abpvue/core';
import { ReportService } from '../report-service';

const pageInjector = provideAbp([
  { provide: ReportService, useValue: { get: async () => ({ total: 0 }) } },
]);
const pageReports = pageInjector.get(ReportService);
~~~

Call this in setup. The override applies to descendants of the component and is destroyed with that scope. In the same setup, plain `inject(ReportService)` still reads the parent; use the returned injector to read the page's override. This example supplies preview data rather than calling a backend.

## Initialization and cleanup

`provideAppInitializer` registers startup work; the app waits for its returned Promise. Resolve dependencies before awaiting inside the initializer. Subscribe explicitly, and use `onServiceDestroy` to release service-owned subscriptions, timers or connections. Avoid module-level mutable state for per-application data.

A multi token collects providers into an array. Its token option and each provider's `multi` flag must agree; use the framework's registration helpers for interceptors and error handlers.

## Package identity and diagnosis

Tokens use Symbol identity. All UI packages should resolve to a single physical instance of the shared packages; libraries declare them as peers rather than bundle their own copies.

For a missing provider, check the exported token, owning provider, initialization order and resolving scope. For destroyed-injector errors, cancel callbacks that outlive their page. [Startup](/development/startup), [testing](/development/testing) and [extension behavior](/customization/extension-behavior) show the surrounding lifecycle.
