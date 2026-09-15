# @lsw-abpvue/identity

User and role management for [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI),
an **unofficial** Vue UI for the [ABP Framework](https://abp.io).

```bash
pnpm add @lsw-abpvue/identity
```

Two entry points, loaded at different times — the split is what keeps user management out
of the first load:

```ts
// main.ts: the menu, at startup
import { provideIdentityConfig } from '@lsw-abpvue/identity/config';

provideIdentityConfig();
```

```ts
// routes.ts: the pages, on the first navigation into /identity
import { lazyRoutes } from '@lsw-abpvue/core/router';

lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes()),
);
```

## What it is

`/identity/users` and `/identity/roles`, both built on the extension system: the columns,
the create and edit fields, the row buttons and the toolbar are all contributors, and the
module's own are registered first so an application's run after them.

| | |
| --- | --- |
| Users | list, create, edit, delete, assign roles, grant permissions |
| Roles | list, create, edit, delete, default and public flags, grant permissions |
| Permissions | through `@lsw-abpvue/permission-management`, from a row button on both pages |

Every button carries the permission ABP checks on the server, so a user who may not
create anything does not see a create button.

## Adding a column without touching the module

```ts
createIdentityRoutes({
  entityPropContributors: {
    [IdentityComponents.Users]: [
      propList =>
        propList.addByIndex(
          EntityProp.create<IdentityUserDto>({
            type: PropType.String,
            name: 'name',
            displayName: 'AbpIdentity::DisplayName:Name',
          }),
          2,
        ),
    ],
  },
});
```

A property added on the server needs none of this: `objectExtensions` becomes a column
and a field on its own, validators included.

## What is not extensible, and why

The roles tab of the user dialog is part of the page rather than a form prop. Which roles
exist is a second request, and what is ticked does not go where the rest of the form goes.
Angular puts it in the form as a `FormArray`; a contributor cannot usefully reach either
version.

## Compared with the Angular UI

Same component keys, same contributor tokens, same localization keys. What differs:

| Angular | Here |
| --- | --- |
| The user name and role name cells are HTML strings rendered with `innerHTML` | Components; nothing here renders markup a contributor produced |
| The contributor record is typed `any` so both pages fit in one call | Assembled per page, so a users contributor is typed against `IdentityUserDto` |
| `AbpIdentity::Edit` / `Delete` / `AreYouSure`, which the backend has no key for | `AbpUi::Edit` / `Delete` / `AreYouSure`, which it does |
| The roles are a `FormArray` on the form | Page state, saved alongside the form's body |

Registered in the design documents' `api-parity-map.md`.

## Licence

MIT.
