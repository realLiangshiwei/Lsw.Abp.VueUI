# Service and composable guide

Service tokens are injected during setup or a provider factory. Composables usually capture those services or create state owned by the current Vue scope.

| Task | API | Behavior guide |
| --- | --- | --- |
| Start application | `createAbpApp`, `provideAbpCore`, `withOptions` | [Startup](/development/startup) |
| Create or replace a service | `defineService`, `defineToken`, `inject`, `provideAbp` | [DI](/concepts/dependency-injection) |
| Read framework state | `useConfigState`, `ConfigStateService` | [State](/concepts/state) |
| Read user | `useCurrentUser` | [Current user](/core/current-user) |
| Login or logout | `AuthService`, `provideAbpOAuth` | [Authentication](/guide/authentication) |
| Translate | `useLocalization`, `$t`, `LocalizationService` | [Localization](/concepts/localization) |
| Check policies | `usePermission`, `PermissionService` | [Permissions](/concepts/permissions) |
| Read settings/features | `useSetting`, `useFeature` | [Settings and features](/core/settings-features) |
| Select tenant | `useMultiTenancy`, `SessionStateService` | [Multi-tenancy](/core/multi-tenancy) |
| Call backend | `useRest`, `RestService` | [HTTP](/core/http) |
| Register navigation | `RoutesService`, `lazyRoutes` | [Routing](/concepts/routes-and-menu) |
| Query lists | `useListService`, `useListPreferences` | [Lists](/utilities/lists) |
| Validate fields | `useAbpForm`, `Validators`, `useValidationMessages`, `useServerValidation` | [Forms](/utilities/forms) |
| Control asynchronous work | `useLatest`, `useDebounceFn`, `useSubscriptions` | [Requests](/utilities/requests) |
| Show feedback | `useToaster`, `useConfirmation`, `usePageAlert` | [Notifications](/utilities/notifications) |
| Replace UI | `ReplaceableComponentsService`, `provideThemeComponents` | [Replacement](/customization/replacement) |
| Extend module pages | `useExtensions`, `EntityProp`, `FormProp`, `EntityAction`, `ToolbarAction` | [Extensions](/concepts/extensions) |

## Providers and tokens

Provider functions belong in the `providers` array passed to `createAbpApp`. Tokens identify a service or a configurable value; replacing a token affects consumers resolving from that injector. `EnvironmentProviders` groups registrations.

The [core](./core), [theme-shared](./theme-shared) and [components](./components) indexes link every public export to its declaration. Use those declarations for exact generic signatures. [Migration mapping](/migration/api-map) describes Promise, Ref and callback differences from Angular.
