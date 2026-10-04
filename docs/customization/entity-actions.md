# Entity action extensions

Row contributors change the built-in action menu. Several visible actions appear in a dropdown; a single action is a button; no visible actions leave no control.

## Replace an action

This example replaces Edit and shows it only for active users. This is an example business rule, not Identity's default editing policy.

<<< ../examples/user-actions.ts

## Register with the module routes

Copy the example into `src/identity-options.ts` and use its exported options in `src/routes.ts`:

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { userActions } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(userActions)),
);
~~~

Add `identityRoute` to the application's route array and keep `provideIdentityConfig()` in startup. Replace the existing identity route rather than registering two routes for the same prefix. Restart the development server when changing module setup, then open `/identity/users`.


## Understand the callback

`EntityAction<IdentityUserDto>` receives `PropData<IdentityUserDto>`. `data.record` is the row. `data.getInjected(USERS_PAGE)` gets commands provided by the built-in users page, so its `edit` method keeps the existing loading, DTO fetch and modal behavior.

The default Edit label is `AbpUi::Edit`. Removal matches that key, not its translated text. If a contributor does not remove the existing action, both actions appear.

`permission` and `visible` are both required to pass. `visible` may be evaluated without a row, so guard optional `data`. `icon` uses the application's icon classes; `showOnlyIcon` also needs an accessible localized label.

## Perform a custom request

Resolve services with `data.getInjected` inside the callback. For example, get a generated service, confirm the intended action with `ConfirmationService`, then await the request. The endpoint, permission and DTO must exist in your own backend.

The returned Promise is accepted, but the grid does not automatically make every custom action busy. Put repeated-action protection in the command or state owned by the page. After a mutation, explicitly reload the page's query.

## Replacement pages

A fully replaced page must provide its own `USERS_PAGE` commands if it renders default action contributors. The route injector does not implement those commands for an arbitrary replacement. [Wrapping the original page](/customization/replacement) retains its command provider.

## Verify

Check active and inactive rows and a user without `AbpIdentity.Users.Update`. Confirm Edit occurs only once, opens the original edit dialog, and does not bypass backend authorization.

See [extension behavior and defaults](/customization/extension-behavior).

## Open a custom detail dialog

Create `src/user-details.ts` and `src/components/UsersPageWithDetails.vue` (adjust its service import). The service fetches a complete Identity user before opening a read-only dialog, and guards repeated clicks while the request is pending.

<<< ../examples/user-details.ts

<<< ../examples/UsersPageWithDetails.vue

Pass `userDetails` to the existing `createIdentityRoutes(userDetails)` lazy route. Then register the wrapper as a replacement after module startup:

```ts
import { inject, provideAppInitializer, ReplaceableComponentsService } from '@lsw-abpvue/core';
import { IdentityComponents } from '@lsw-abpvue/identity';
import UsersPageWithDetails from './components/UsersPageWithDetails.vue';

export const detailsPage = provideAppInitializer(() => {
  inject(ReplaceableComponentsService).add({ key: IdentityComponents.Users, component: UsersPageWithDetails });
});
```

Add detailsPage to startup providers and add BookStore::Details to the localization resource. Both the contributor and wrapper resolve the same root service. The imported UsersPage continues to provide its built-in commands and extension rendering. No business endpoint is invented by this example: the detail query uses the packaged Identity proxy.

## Add, remove and order

Use addHead/addTail for the ends and addBefore/addAfter with a predicate for a relative position. Removal matches the stable action text key, not translated text. To replace a possibly duplicated item, dropByValueAll first. A predicate that expects a missing anchor can fail: choose a fallback position when extending a module whose defaults vary.

Do not use clearContributors to remove one button; it removes every contributor in that bucket. Keep the module defaults and remove the final list item you intend to replace. Test the action on two different rows so the captured record cannot accidentally stay on the previous selection.
