# API by API

`=` identical · `≈` renamed or reshaped · `Δ` deliberately different · `Δ+` an improvement
on Angular · `✗` not provided

The authoritative list is `api-parity-map.md` in the design documents, which carries the
reason for every difference. This is the working subset.

## Bootstrap

| Angular | Here | |
| --- | --- | --- |
| `bootstrapApplication(App, config)` | `createAbpApp(App, { providers })` | ≈ returns a promise; `await` it, then `mount()` |
| `provideAbpCore(withOptions({...}))` | same | = |
| `provideRouter(routes)` | `provideAbpRouter(routes)` | ≈ creates the router and registers the guards |
| `provideAppInitializer(fn)` | same | = awaited in order |
| `APP_INIT_ERROR_HANDLERS` | `provideAppInitErrorHandler(fn)` | Δ startup continues when a handler is registered, so an unreachable backend is a sentence on the screen rather than a white page |
| `environment.ts`, at build time | `public/dynamic-env.json`, at runtime | Δ same fields; one build, many environments |

## Dependency injection

| Angular | Here | |
| --- | --- | --- |
| `InjectionToken<T>` | `defineToken<T>(name, options?)` | ≈ |
| `@Injectable()` + class | `defineService(name, factory)` | Δ no decorators, no `reflect-metadata` |
| `inject(Token)` | `inject(Token)` | = |
| `injector.get(Token)` | same | = what `getInjected` in a contributor uses |
| `useClass` / `useValue` / `useFactory` / `useExisting` | same | = |
| `deps: [...]` | ✗ | Δ always `inject()` |
| `multi: true` | same | ≈ provider and token must agree, or it throws |
| `makeEnvironmentProviders()` | same | = |
| Component-level `providers: []` | `provideAbp([...])` in `setup()` | ≈ order matters: an `inject()` before it still sees the parent |
| `DestroyRef.onDestroy(fn)` | `onServiceDestroy(fn)` | ≈ |
| `NullInjectorError` | same, plus `MultiProviderMismatchError`, `DuplicateFeatureError`, `InjectorDestroyedError` | Δ+ three cases Angular either overwrites silently or defers to runtime |

## HTTP

| Angular | Here | |
| --- | --- | --- |
| `HttpErrorResponse` | `AbpHttpError` | ≈ `error` is the inner envelope object; `isTransportFailure` for `status === 0` |
| Unsubscribing cancels a request | `RestConfig.signal` | Δ a promise has no subscription to drop |
| `RestService.request<In, Out>()` | same | = |
| HTTP requests have no extra AJAX marker | `RestService` adds `X-Requested-With: XMLHttpRequest` | Δ+ cookie authentication returns 401/403 rather than login-page HTML; an explicit header wins, and `skipAddingHeader` opts out |
| `IS_EXTERNAL_REQUEST` (drops every header) | `RestConfig.skipAuthorization` (drops only the bearer) | Δ+ the token endpoint needs `__tenant` but not `Authorization` |
| `HTTP_INTERCEPTORS` | same | = |

## State

| Angular | Here | |
| --- | --- | --- |
| `getOne(k)` and `getOne$(k)` | `getOne(k): ComputedRef<T>` | Δ one API; `.value` is the snapshot |
| `getDeep(path)` / `getDeep$` | `getDeep(path): ComputedRef<T>` | Δ as above |
| `ConfigStateService.getAll()` | `snapshot()` | ≈ |
| `dispatchGetAppConfiguration()` | `refreshAppState()` | ≈ |
| Initial state `{}` | Structurally complete and empty | Δ+ the guarding is paid once, at the edge |

## Localization

| Angular | Here | |
| --- | --- | --- |
| `\| abpLocalization` | `$t()` | ≈ a global property, reactive by itself |
| `LocalizationService.instant()` | `t()` | ≈ |
| `get()` returning an observable | `tr()` returning a `ComputedRef` | ≈ |
| A language change remounts the layout | It does not | Δ+ the texts are reactive |
| `{ key, defaultValue }` | same | = |

## Permissions

| Angular | Here | |
| --- | --- | --- |
| `PermissionService.getGrantedPolicy(name)` | `isGranted(name)` | ≈ |
| `getGrantedPolicy$` | `isGrantedRef(name)` | ≈ |
| `*abpPermission` | `<AbpPermission policy="">` | Δ a Vue directive cannot remove its own element |
| `A \|\| B`, `A && B` | same | = |
| Parenthesised expressions return false | Supported | Δ+ |
| Permission names are bare strings | Generated constants, optionally type-narrowed | Δ+ |

## Routes and the menu

| Angular | Here | |
| --- | --- | --- |
| `RoutesService.add/patch/remove/removeByParam` | same | = |
| `visible$`, `flat$`, `tree$` | `visible`, `flat`, `tree`, as `ComputedRef` | ≈ |
| `loadChildren` | `lazyRoutes(prefix, loader)` | ≈ |
| Route `resolve` | `beforeEnter: [withResolvers([...])]` | ≈ |
| `ReplaceableComponents` | same service, same keys | = |
| `DynamicLayoutComponent` | `AbpDynamicLayout` | ≈ |

## Lists

| Angular | Here | |
| --- | --- | --- |
| `ListService`, provided per component | `useListService()` | ≈ a composable |
| `hookToQuery(fn)` | same | ≈ returns `{ items, totalCount, loading }` as refs |
| `list.get()`, `list.page`, `list.filter`, `list.sortKey` | same | = |
| — | `persistKey` remembers page size and sort per page | Δ+ |

## The extension system

| Angular | Here | |
| --- | --- | --- |
| Component keys | Identical strings | = |
| `EntityProp` / `FormProp` / `EntityAction` / `ToolbarAction` | same names, same options | = |
| Contributor callbacks | Same signature | = |
| `valueResolver` may return HTML | Returns text; `component` for anything richer | Δ safety |
| Repeated assembly duplicates columns | Idempotent | Δ+ |
| No diagnostics | `__abpvue.inspect()` in development | Δ+ |
| `toRequestBody` sends only the form's extension properties | Sends the record's, overridden by the form's | Δ+ otherwise a save erases what the user never saw |

## Themes

| Angular | Here | |
| --- | --- | --- |
| `theme-shared` depends on ng-bootstrap | `theme-shared` has no UI dependency | Δ+ |
| `ToasterService`, `ConfirmationService` | same names | = |
| Toast timing lives in the component | It lives in the service | Δ+ every theme would otherwise reimplement it |
| `DateTimeAdapter` converts a string to browser-local time | Reka calendar and time segments display the calendar date and time written in the ISO string, using ABP culture patterns | Δ no browser-timezone conversion; an unedited value keeps its original ISO representation |
| — | `runThemeContractTests(theme)`: 70 behavioural assertions plus axe | Δ+ |
| — | Tables carry a `<caption>`; `aria-sort` is set | Δ+ a11y baseline |

## Authentication

| Angular | Here | |
| --- | --- | --- |
| `AuthService.navigateToLogin/login/logout` | same | = |
| `LoginParams` | plus `twoFactorProvider`, `twoFactorCode`, `recoveryCode` | Δ+ the open source token endpoint takes them already |
| Failure is an `HttpErrorResponse` | `AuthError`, `TwoFactorRequiredError` | Δ+ typed |
| Account module two-factor delivery | `TwoFactorService` host adapter | Δ open-source ABP exposes no email/SMS delivery API; provider selection and send/resend are supported when the host supplies one |
| Token storage is `localStorage` | `TokenStorage` is a token: `BrowserTokenStorage`, `MemoryTokenStorage`, `ServerTokenStorage` | ≈ |
| A domain tenant that does not resolve is ignored | `TenantNotFoundError` | Δ+ otherwise a tenant host shows the host's data |
| Switching tenants keeps the token | The token is discarded when its `tenantid` disagrees | Δ+ |

## The CLI

| Angular | Here | |
| --- | --- | --- |
| `ng generate @abp/ng.schematics:generate-proxy` | `abpv proxy add` | ≈ same algorithm, plus validators, permission names and `--dry-run` |
| `ng generate @abp/ng.schematics:create-lib` | `abpv create-lib` | Δ writes a standalone repository, not a workspace project |
| `ng update` | `abpv update` | Δ moves versions and runs migrations; no code mods |
| — | Pure `core/object-extensions` entry shared by runtime and doctor | Δ+ no Vue import in Node |
| — | `abpv new`, `abpv switch-ui`, `abpv doctor`, `abpv generate` | Δ+ |
