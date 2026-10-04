# Replace components

Replace a whole page when contributors cannot express the required UI. The public key is stable, for example `Identity.UsersComponent`.

## Wrap the existing users page

Create `src/components/UsersPageWithNotice.vue`:

<<< ../examples/UsersPageWithNotice.vue

This component imports the original `UsersPage` directly. It adds a notice while preserving the built-in query, CRUD, command tokens, contributors and modal behavior. Rendering the imported original component does not recurse through the replacement registry.

Add `BookStore::UsersNotice` to your localization resource, then register the wrapper:

~~~ts
import { inject, provideAppInitializer, ReplaceableComponentsService } from '@lsw-abpvue/core';
import { IdentityComponents } from '@lsw-abpvue/identity';
import UsersPageWithNotice from './components/UsersPageWithNotice.vue';

export const replaceUsers = provideAppInitializer(() => {
  inject(ReplaceableComponentsService).add({
    key: IdentityComponents.Users,
    component: UsersPageWithNotice,
  });
});
~~~

Add `replaceUsers` to the existing startup providers after module registrations. Keep the existing Identity routes. The route's `AbpReplaceableRouteContainer` picks the registry component or falls back to the module's default.

## Rebuild the page instead

A replacement remains under the module route injector: guards, metadata and assembled extension registries remain available. The original page's local state and commands are not automatically instantiated.

If you use `AbpExtensibleTable` or `AbpPageToolbar`, default action callbacks may resolve `USERS_PAGE`. Provide that token with your own add/edit/remove/managePermissions commands using `provideAbp`. The replacement must also own list refresh, validation, concurrency and dialog state. Alternatively render explicit application columns/actions instead of module extensions.

Changing a registered component at runtime can remount it and discard its local form state. Prefer startup registration; coordinate state explicitly if runtime switching is required.

## Replace a theme control

~~~ts
import { provideThemeComponents } from '@lsw-abpvue/theme-shared';
import MyDatePicker from './components/MyDatePicker.vue';

const datePickerOverride = provideThemeComponents({ AbpDatePicker: MyDatePicker });
~~~

Place the override after the selected theme provider. These twelve controls use the theme contract registry, whereas page/layout components use `ReplaceableComponentsService`. Implement the documented model, props, events and slots and run the theme contract tests.

## Verify

Open users, confirm the notice and existing columns, create/edit/cancel a record, and repeat with a denied route policy. Also check host contributors still apply. For a full rebuild, exercise every command referenced by the default actions.

See [extension callbacks](/customization/extension-behavior), [theme contracts](/concepts/themes) and [profile/settings tabs](/customization/profile-settings).

## Complete replacement with module extensions

Create `src/components/UsersReplacement.vue` from this example:

<<< ../examples/UsersReplacement.vue

It keeps the route's resolved contributor registries and supplies every command that the default Users actions require. It owns the list, loads full details/roles before editing, includes roleNames and concurrencyStamp on save, and opens packaged permission management with provider U and the user id. The casts at the extensible DTO boundary reflect runtime field assembly; they do not validate a body on the client.

Register it with the same replacement initializer used above, changing the imported component to UsersReplacement. Keep the existing Identity config and lazy route, and install/register permission management as in the generated template. This page intentionally does not clear or re-register module defaults. Host column/form/action contributors continue to work.

## Choose a level of customization

| Need | Use |
| --- | --- |
| Add a notice or surrounding content | Wrapper importing the original page |
| Add/reorder a column, field or command | Contributor |
| Change all interaction and layout while retaining module extension contracts | Full replacement with command providers |
| Change one themed input everywhere | Theme component override |

A route component replacement does not change the backend endpoint or its permission requirements. A read-only replacement can use explicit columns instead, but should then document which built-in actions it intentionally removes.

## Diagnose a missing command

If a contributed action throws NullInjectorError for USERS_PAGE, check that the replacement creates the page injector before its toolbar/table children mount. Resolving the token from the route alone cannot supply an arbitrary page's local functions. If the replacement recursively renders itself, import the original page directly for wrapping rather than another replaceable container with the same key.
