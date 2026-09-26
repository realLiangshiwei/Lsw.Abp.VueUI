# Coming from the Angular UI

The features and the extension points are the same, and so are the names that matter:
component keys, localization keys, DTO field names, permission names, policy expression
syntax. A configuration written against `@abp/ng.*` moves over as it is.

What changes is the shape of the API, and it changes in one direction: **there is no
RxJS**.

## The one thing to internalise

Angular gives you two APIs for every piece of state — a snapshot and a stream:

```ts
// Angular
const user = this.config.getOne('currentUser');
this.config.getOne$('currentUser').subscribe(user => ...);
```

Here there is one, and it is already reactive:

```ts
const user = config.getOne('currentUser');   // ComputedRef<CurrentUserDto>
user.value;                                  // the snapshot
```

In a template it re-renders on its own. In code, `watch` or `computed` over it. Nothing
to subscribe to and nothing to unsubscribe from — which is also why there is no
`SubscriptionService`.

Requests return promises rather than observables:

```ts
const page = await users.getList({ maxResultCount: 10, skipCount: 0 });
```

## What maps to what

| Angular | Here |
| --- | --- |
| `@Injectable()` | `defineService(name, factory)` |
| `InjectionToken` | `defineToken<T>(name)` |
| `inject()` | `inject()` |
| Component-level `providers: []` | `provideAbp([...])` in `setup()` |
| `\| abpLocalization` | `$t()`, a global property |
| `*abpPermission` | `<AbpPermission policy="">` |
| `ngComponentOutlet` | `<component :is>` |
| Route `resolve` | `beforeEnter: [withResolvers([...])]` |
| `loadChildren` | `lazyRoutes(prefix, () => import(...))` |
| `ListService` (component-provided) | `useListService()` |
| `TemplateRef` passed through DI | A scoped slot |
| `environment.ts` | The same object, read at runtime from `dynamic-env.json` |

The full table, entry by entry: [API by API](./api-map).

## Things that are deliberately different

A short list of places where copying Angular would have meant copying a bug:

| | |
| --- | --- |
| `valueResolver` returns text, not HTML | A column built from user data is not somewhere to put `innerHTML` |
| Policy expressions support parentheses | Angular returns false for them; its source carries a `TODO` |
| `checkPolicies` returns a filtered copy | Angular deletes from the configuration state, and a higher-privileged user cannot get those properties back until the next refresh |
| A tenant that does not resolve throws | Angular treats `200` with `success: false` as "no tenant" and shows the host's data |
| Switching tenants discards a token minted for the old one | Otherwise every following request is a 401 nobody can explain |
| The edit form does not drop extension properties it did not show | Angular sends only what was on the form, which erases values the user never saw |

Each of them, and every other difference, is written down with its reason.

## What is not here

| | Why |
| --- | --- |
| Commercial module UIs | They need a licence |
| Locking a user out, per-user two-factor, resource permissions | The open source backend has no endpoint |
| `ng update` code mods | `abpv update` moves versions and runs migrations; it does not rewrite your calls |

## Moving an application

1. `abpv switch-ui --mode keep` — the Vue UI goes in next to the Angular one, and both
   can run while you work.
2. `abpv proxy add --module all` — the services, DTOs, validators and permission names.
3. Move your contributors across. The component keys and the callback shapes are
   identical; what changes is `Observable` becoming a promise or a ref in the few places
   a contributor returned one.
4. Move your pages. A page built on `ListService` and the extensible table is mostly the
   same page.
5. `abpv doctor`, then delete `angular.bak/` when you are done.
