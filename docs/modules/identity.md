# Identity

Users and roles with CRUD, search, role assignment and permission dialogs.

## Install and register

```bash
pnpm add @lsw-abpvue/identity@alpha
```

```ts
import { provideIdentityConfig } from '@lsw-abpvue/identity/config';
import { lazyRoutes } from '@lsw-abpvue/core/router';

const moduleConfig = provideIdentityConfig();
const moduleRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes()),
);
```

Add `moduleConfig` to startup providers and `moduleRoute` to your routes. Keep the matching ABP backend module installed.

## Routes and keys

| Page | Route | Key |
| --- | --- | --- |
| Users | `/identity/users` | `Identity.UsersComponent` |
| Roles | `/identity/roles` | `Identity.RolesComponent` |

## Permissions and configuration

Page policies are `AbpIdentity.Users` and `AbpIdentity.Roles`. Create, Update, Delete and ManagePermissions use the corresponding suffix. Import `IdentityPolicyNames` from `/config` to avoid spelling errors.

## Behavior and customization

The five contributor maps customize columns, create/edit fields, row actions and toolbar actions. Object extensions for `Identity.User` and `Identity.Role` map supported metadata automatically. See the [users extension tutorial](/tutorials/extend-users). Lockout administration, password setting for another user and per-user two-factor administration need backend APIs absent from the open-source module.

Services and DTOs are in `@lsw-abpvue/identity/proxy`. Startup configuration is imported from the package's `/config` entry; pass page contributors to its route factory.
