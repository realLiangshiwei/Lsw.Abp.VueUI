# @lsw-abpvue/core

The kernel of [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an
**unofficial** Vue UI for the [ABP Framework](https://abp.io). Everything else in the
project — themes, the extension system, the module pages — is built on the dependency
injection this package provides.

```bash
pnpm add @lsw-abpvue/core
```

> Milestone M1 is complete: dependency injection, application state, HTTP,
> localization, permissions, the session, multi-tenancy, the route tree and the
> `/router` entry point. Authentication arrives with `@lsw-abpvue/oauth` in M2.

## Dependency injection

A service is a factory and a name. It is built on first injection, once per root
injector, and it can inject other services while it is being built.

```ts
import { defineService, inject, type ServiceOf } from '@lsw-abpvue/core';

export const GreeterService = defineService('GreeterService', () => {
  const template = inject(GREETING_TEMPLATE);
  return { greet: (name: string) => interpolate(template, [name]) };
});
export type GreeterService = ServiceOf<typeof GreeterService>;

export const useGreeter = () => inject(GreeterService);
```

Applications bootstrap through `createAbpApp`, which owns the root injector and waits for
the registered initializers before mounting:

```ts
const { mount } = await createAbpApp(App, {
  providers: [
    { provide: GREETING_TEMPLATE, useValue: 'Hei {0}.' },
    provideAppInitializer(() => inject(ConfigStateService).refreshAppState()),
  ],
});

mount('#app');
```

A page overrides a service for itself and its children with one call. The injector it
returns is the escape hatch for callbacks, which have no injection context of their own:

```vue
<script setup lang="ts">
const injector = provideAbp([{ provide: GreeterService, useFactory: createMyGreeter }]);

const onClick = () => injector.get(GreeterService).greet('a click handler');
</script>
```

`inject()` is synchronous, exactly as in Angular: the context ends at the first `await`.
Capture the injector before awaiting, or resolve everything up front.

## What else is in it

| | |
|---|---|
| `ConfigStateService` | Everything `/api/abp/application-configuration` returns, as reactive state. Refreshed after a login, a logout or a tenant switch, which is what makes menus and permission checks recompute on their own. |
| `RestService` / `HttpClient` | fetch with an interceptor onion. Failures arrive as one `AbpHttpError` carrying ABP's error envelope. |
| `LocalizationService` / `$t` | `Resource::Key` resolution with ABP's rules, plus texts shipped with the application. A language change re-renders what used it; nothing is remounted. |
| `PermissionService` | `A && B`, `A \|\| C` and — unlike the Angular UI — the two mixed with parentheses. |
| `RoutesService` | The menu, built from what routes declare in `meta.routes` and filtered by the granted policies. |
| `useListService` | Paging, sorting and debounced filtering for a table, with the answer to a superseded request dropped. |
| `@lsw-abpvue/core/router` | `provideAbpRouter`, the auth and permission guards, `lazyRoutes`, the title strategy, `AbpDynamicLayout`. |

## How it lines up with the Angular UI

| ABP Angular | Here |
|---|---|
| `@Injectable({ providedIn: 'root' })` | `defineService(name, factory)` |
| `new InjectionToken<T>()` | `defineToken<T>(name)` |
| `inject(Service)` | `inject(Service)` or the `useXxx()` wrapper |
| A component's `providers: []` | `provideAbp([...])` in `<script setup>` |
| `provideAppInitializer` | `provideAppInitializer` |
| `bootstrapApplication(App, appConfig)` | `createAbpApp(App, { providers })` |
| `makeEnvironmentProviders` / `withXxx()` features | same, via `defineFeature` |
| `Injector.get(token)` for `getInjected` | `injector.get(token)` |

Decorators, `reflect-metadata` and `deps` arrays are gone: a factory calls `inject()`
instead. Nothing is registered by importing it, so a service nobody injects is dropped by
the bundler.

## License

MIT. Not affiliated with or endorsed by Volosoft or the ABP Framework team.
