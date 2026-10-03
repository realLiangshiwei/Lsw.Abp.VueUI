# Application state

`/api/abp/application-configuration` is the whole of it: the current user, the granted
permissions, the settings, the features, the localization texts, the object extensions and
the tenant. It is fetched once at startup, and again whenever something invalidates it —
signing in, signing out, switching tenant, changing language.

## Reading it

```ts
const config = inject(ConfigStateService);

const user = config.getOne('currentUser');            // ComputedRef<CurrentUserDto>
const clock = config.getDeep('timing.timeZone.iana'); // ComputedRef<string | undefined>
const all = config.snapshot();                        // the object, right now
```

`getOne` and `getDeep` return `ComputedRef`, so a template re-renders on its own when the
configuration is replaced. `.value` is the snapshot; there is no second stream-shaped API
next to it the way Angular has `getOne` and `getOne$`.

The services on top of it are what you usually want:

| | |
| --- | --- |
| `CurrentUserService` | Who is signed in, and whether anyone is |
| `PermissionService` | `isGranted('Identity.Users.Create')` |
| `SettingService` | `get('Abp.Localization.DefaultLanguage')` |
| `FeatureService` | `isEnabled('BookStore.Printing')` |
| `SessionStateService` | Language and tenant, which are the visitor's choices rather than the server's |
| `LocalizationService` | The texts, and switching between them |

## Its initial value

Structurally complete and empty, rather than `{}`. Angular starts with an empty object and
every reader guards its way down the tree; here the guarding is paid for once, at the
edge, so the code that reads state does not have to be written defensively.

## Refreshing

```ts
await config.refreshAppState();
```

Anything that changes what the server would say — a role granted, a setting saved —
should refresh, and the module UIs already do it where they change something. Two
refreshes in a row resolve to the newest one, and the whole object is replaced, which is
why everything reading it is a `ComputedRef`.

## Its own store

`InternalStore` is what holds it: a `shallowRef` with typed selectors. Shallow on purpose
— the configuration is a large object, and deep reactivity over it would cost far more
than it returns, given that it is replaced wholesale rather than mutated.

There is no Pinia and no Vuex. A store around a server-owned object that is only ever
replaced would be ceremony with no payoff; a bridge package for applications that already
use Pinia is on the list for after 1.0.

## List preferences

`useListPreferences(key)` stores page size, sort and hidden columns per user. Page number
and filters are never persisted. Corrupt or incompatible stored values are ignored
silently. Logout and failed token renewal remove preferences for the current user only;
`clearListPreferences(storage, userId)` provides the same cleanup for custom authentication.
