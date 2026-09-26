# Identity

Users and roles.

```ts
provideIdentityConfig();   // main.ts, the menu

lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(m => m.createIdentityRoutes(options)),
);
```

| Page | Route | Component key |
| --- | --- | --- |
| Users | `/identity/users` | `Identity.UsersComponent` |
| Roles | `/identity/roles` | `Identity.RolesComponent` |

Both are extensible tables with a create/edit dialog, a search box and the permission
dialog behind a row action. The users dialog has a second tab for role assignment.

## Contributors

```ts
createIdentityRoutes({
  entityPropContributors: { [IdentityComponents.Users]: [...] },
  createFormPropContributors: { [IdentityComponents.Users]: [...] },
  editFormPropContributors: { [IdentityComponents.Users]: [...] },
  entityActionContributors: { [IdentityComponents.Users]: [...] },
  toolbarActionContributors: { [IdentityComponents.Users]: [...] },
});
```

Component keys and contributor shapes are `@abp/ng.identity`'s, verbatim.

## Object extensions

A property declared in `ObjectExtensions` for `Identity.User` becomes a column and a form
field with no code here — it arrives in `application-configuration`, and the validators
its attributes stand for come with it.

## What is not here

| | Why |
| --- | --- |
| Lock a user out, set their password | `IdentityUserAppService` in the open source module has no endpoint for either |
| Per-user two-factor settings | Same; the commercial identity module adds them |
