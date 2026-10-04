# Extend the users page

Use contributors when changing an existing module page. This example adds a display-name column and a row action while retaining the module's default CRUD behavior.

## 1. Define contributors

Create `src/identity-options.ts` with the following content. The callbacks are typed to `IdentityUserDto`; the action uses `data.getInjected` because it executes later, outside setup.

<<< ../examples/users-extension.ts

`displayLabel` is a derived display column, not a backend DTO field. It has no server sorting enabled. The action reports the selected username; replace it with your business operation and add an appropriate `permission` if needed.

## 2. Pass options to lazy routes

```ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { identityOptions } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(identityOptions)),
);
```

Keep `provideIdentityConfig()` at startup and add `identityRoute` to your routes. Open `/identity/users` and check the new column and action. Re-entering the page should not duplicate them.

## 3. Other extension points

The same options object supports create fields, edit fields and toolbar actions. Contributors execute after defaults and backend object extensions. Use the linked-list methods to insert, remove or reorder items. See [page extensions](/concepts/extensions).

For a page belonging to your own application, edit its columns and methods directly instead of registering contributors.
