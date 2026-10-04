# Extend the users page

Add a derived name column and a row action to the built-in Identity UI while retaining its default CRUD behavior. Start with an application that can sign in and open `/identity/users`.

## 1. Add the contributor file

Create `src/identity-options.ts`:

<<< ../examples/users-extension.ts

`displayLabel` is a derived frontend field, so it does not enable server sorting. The action displays the selected username using the shared Toaster service.

Callbacks execute later, outside setup. `data.getInjected` retrieves services from the page's extension context.

## 2. Register the lazy route

In `src/routes.ts`:

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { identityOptions } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(identityOptions)),
);
~~~

Replace the existing identity route with this one and keep it in the exported route array. Preserve `provideIdentityConfig()` in the application's startup providers. Two lazy registrations for the same prefix can make it unclear which options are active.

## 3. Add localization

The derived column uses an existing Identity label. For application-specific action text, add keys to your backend resource or `withLocalizations`. See [localization](/concepts/localization). The notification in this example has the username as a fallback, so it remains readable without the optional BookStore key.

## 4. Check the behavior

Open users, confirm the extra column, click the action and observe one notification. Leave the page and return; the column/action should not duplicate. Confirm built-in editing and permissions still work.

## 5. Add another kind of contributor

Follow the focused guides:

- [Table columns](/customization/table-columns): replace a cell with a typed Vue component.
- [Entity actions](/customization/entity-actions): replace Edit while retaining the page command.
- [Form fields](/customization/form-fields): configure and persist an extra property.
- [Toolbar actions](/customization/toolbar-actions): use current-page record context.

When combining option objects, merge each contributor map and callback array deliberately. An object spread alone overwrites an earlier map with the same property; it does not concatenate its contributors.

## Where this approach belongs

Use contributor configuration for built-in/reusable modules. For your own generated business page, edit its columns and CRUD methods directly. For a complete custom module page, understand [replacement context](/customization/replacement) before reusing default actions.
