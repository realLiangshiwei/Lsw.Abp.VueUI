# Application state

Application configuration contains the current user, granted policies, settings, features, localization, object extensions and current tenant. The app reads it during startup and refreshes it when the session changes.

## Read reactive state

~~~ts
import { useConfigState } from '@lsw-abpvue/core';

const config = useConfigState();
const user = config.getOne('currentUser');
const clock = config.getDeep<string | undefined>('timing.timeZone.iana');
const snapshot = config.snapshot();
~~~

`getOne` returns a typed computed ref for a top-level field. `getDeep` reads a dotted path; its generic is a caller assertion, so include undefined for paths that may be absent. Templates unwrap refs; scripts read `.value`.

`snapshot()` returns the object at that moment. Saving that object in a variable does not make it follow later configuration replacements. Use a selector for a value displayed on screen.

## Choose a focused service

| Need | Service / composable |
| --- | --- |
| Current user and authenticated state | `CurrentUserService` / `useCurrentUser` |
| Granted policies | `PermissionService` / `usePermission` |
| Setting values | `SettingService` / `useSetting` |
| Tenant and global features | `FeatureService` / `useFeature` |
| Translation texts and culture | `LocalizationService` / `useLocalization` |
| Visitor's language and tenant selection | `SessionStateService` / `useSessionState` |

Application configuration is the server's effective result. Session state holds visitor choices and synchronizes supported changes across browser tabs. Neither is a store for arbitrary business records; keep page drafts and query results in their own Vue scope.

## Refresh after a change

~~~ts
const saveAndRefresh = async (): Promise<void> => {
  await saveCurrentUser();
  await config.refreshAppState();
};
~~~

Here `saveCurrentUser` is the page's actual save operation. Refresh when it changes effective current-user, permission, setting or tenant values. Do not refresh the entire configuration after every business CRUD request.

Refresh loads configuration and the selected culture's texts. Overlapping refreshes keep the latest result and abort older work. A failed request rejects and preserves existing state; handle it with the normal request feedback. A successful mutation followed by a failed refresh does not undo the server change.

Use `refreshLocalization(cultureName)` for a culture's texts; the localization service coordinates language selection. [Localization](/concepts/localization) explains that flow.

## Initial state and updates

Initial structure is complete but values are empty. Before startup finishes, a current user can still be anonymous, policies can be denied and feature values can be absent. Show loading through application startup or the page, not by treating an empty user as authenticated.

Configuration is held in a shallow store and replaced through service methods. Do not mutate `snapshot().auth.grantedPolicies` or other nested fields in place: readers depend on the published update. `setState` is useful for deliberately supplied configuration and isolated tests; normal applications load it from the backend.

For a callback outside a template, `config.onUpdate(callback)` returns an unsubscribe function. Tie cleanup to the component or service lifecycle so stale pages stop receiving changes.

## Page preferences

`useListPreferences(key)` persists page size, sorting and hidden columns per user. It does not persist page number or filters. Invalid stored values fall back to defaults; logout and failed renewal clear the current user's preferences. See [lists and preferences](/utilities/lists) for the storage key and query lifecycle.
