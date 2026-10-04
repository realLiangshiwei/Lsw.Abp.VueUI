# Angular API mapping

Identifiers can be reused, but runtime return types and component code need adaptation. This table covers common public APIs; follow linked guides for behavior and the package reference for exact signatures.

| Angular concept | Vue API | Adaptation |
| --- | --- | --- |
| Application bootstrap | `createAbpApp` | Await before mounting |
| Core configuration | `provideAbpCore(withOptions(...))` | Provider-based registration |
| InjectionToken | `defineToken<T>` | Typed Symbol |
| Injectable service | `defineService` | Factory and inferred service type |
| inject | `inject` from core | Synchronous injection context |
| Component providers | `provideAbp` | Child injector for descendants |
| DestroyRef | `onServiceDestroy` | Service cleanup |
| Config snapshot/observable APIs | `getOne`, `getDeep` | ComputedRef; `.value` reads snapshot |
| REST observable | `RestService.request` | Promise; `signal` cancels |
| Localization pipe | `$t` | Reactive template translation |
| instant/get translation | `t` / `tr` | String / ComputedRef |
| Permission directive | `AbpPermission` | Conditional rendering component |
| Granted policy API | `isGranted` / `isGrantedRef` | Boolean / ComputedRef |
| loadChildren | `lazyRoutes` | Async route factory |
| Route resolve | `withResolvers` | Await route initialization |
| Component route scope | `AbpRouterOutlet` | Route providers |
| Dynamic layout | `AbpDynamicLayout` | Route layout metadata |
| ReplaceableComponents | `ReplaceableComponentsService` | Same public component keys |
| Component ListService | `useListService` | State owned by Vue scope |
| hookToQuery | `hookToQuery` | Returns items, totalCount and error refs; status is on list |
| Reactive forms | `useAbpForm` | Control value getters/setters and validators |
| TemplateRef | Scoped slots or Vue components | No Angular template instance |
| EntityProp/FormProp/actions | Same public class names | Vue value resolvers and components |
| Contributor callbacks | Contributor maps | Same keyed structure; adapt Observable results |
| Toaster/Confirmation | `useToaster` / `useConfirmation` | Theme-independent services; confirmation is a Promise |
| Login/logout | `AuthService` | Selected flow controls redirects |
| Proxy schematics | `abpv proxy` | Generated TS services and DTOs |
| Library schematics | `abpv create-lib` | Standalone package scaffold |
| Package update | `abpv update` | Version changes and registered migrations |

## Behavior to review

- Policy expressions support AND, OR and parentheses.
- Resolver text is rendered as text; rich cells use components.
- Domain tenant lookup failure stops startup; tenant changes invalidate mismatched tokens.
- Edit requests preserve extra properties not represented by visible controls.
- Theme contracts have no UI-library dependency; the selected theme implements them.
- Ordinary generated business pages do not register module extension points.

Read [DI](/concepts/dependency-injection), [extensions](/concepts/extensions), [authentication](/guide/authentication) and [lists](/utilities/lists) before adapting those areas. The reference documents this implementation; it does not claim every commercial Angular UI feature is included.
