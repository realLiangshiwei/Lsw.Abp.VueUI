# Replace components

Replace an entire module page when contributors cannot express the required behavior. The public component key identifies the replacement and matches ABP Angular's key.

```ts
import { inject, provideAppInitializer, ReplaceableComponentsService } from '@lsw-abpvue/core';
import { IdentityComponents } from '@lsw-abpvue/identity';
import MyUsersPage from './MyUsersPage.vue';

const customUsers = provideAppInitializer(() => {
  inject(ReplaceableComponentsService).add({
    key: IdentityComponents.Users,
    component: MyUsersPage,
  });
});
```

Add `customUsers` to your application providers after the providers whose registrations it overrides. Registering another component under the same key replaces the previous entry. Routes using `AbpReplaceableRouteContainer` render the current registration; route guards and policy metadata still apply.

## Theme contracts

Replacing one of the twelve theme controls uses `provideThemeComponents`, because those controls resolve through the theme contract registry. Place the override after the selected theme provider:

```ts
import { provideThemeComponents } from '@lsw-abpvue/theme-shared';
import MyDatePicker from './MyDatePicker.vue';

const datePickerOverride = provideThemeComponents({ AbpDatePicker: MyDatePicker });
```

Implement the component's public props, events, slots and accessible behavior. The [component reference](/components/) describes that contract. [Page extensions](/concepts/extensions) are the smaller change path for existing columns, fields and actions.
