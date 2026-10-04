# Current user

`useCurrentUser()` reads the current user reported by application configuration. Its values update when configuration is reloaded.

```ts
import { useCurrentUser } from '@lsw-abpvue/core';

const currentUser = useCurrentUser();
const user = currentUser.user;
const authenticated = currentUser.isAuthenticated;
const roles = currentUser.roles;
```

These are computed refs. Use `.value` in script and Vue's automatic unwrapping in templates. Anonymous configuration is valid; do not assume `user.id` exists.

## Identity and authorization

Use current-user data to display a name or choose a signed-in view. Use `PermissionService` for permission checks. A role name is not a substitute for a granted policy, and the backend still enforces every protected operation.

For authentication navigation, inject `AuthService`. It chooses the local login page or the authorization server according to the configured flow. [Authentication](/guide/authentication) covers the corresponding profile and logout behavior.

## Refreshing user data

A successful authentication operation reloads application configuration. After a custom operation changes the current user's permissions or profile, refresh the affected state explicitly. `ConfigStateService.refreshAppState()` reloads framework configuration; profile tabs also have their own profile state in `account-core`.
