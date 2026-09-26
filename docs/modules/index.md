# Module UIs

The six open source ABP modules, each as its own package with three entry points.

| Package | What it gives you |
| --- | --- |
| [`account`](./account) | Login, register, forgot and reset password, the profile page |
| [`account-core`](./account) | The pieces both the account pages and a theme need: the tenant box, the profile tabs |
| [`identity`](./identity) | Users and roles, with their permissions |
| [`permission-management`](./permission-management) | The permission dialog, for any provider |
| [`tenant-management`](./tenant-management) | Tenants, their features and their connection strings |
| [`feature-management`](./feature-management) | The feature dialog, for any provider |
| [`setting-management`](./setting-management) | The settings page and its tab tree |

## Wiring one up

Two lines, in two places. The menu at startup:

```ts
// main.ts
provideIdentityConfig();
```

The pages, lazily:

```ts
// routes.ts
lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes()),
);
```

`abpv new` writes both for the modules you asked for.

## Customising one

Every page is a contributor to the [extension system](../concepts/extensions), so a
column, a field or a button is added from the host:

```ts
createIdentityRoutes({
  entityPropContributors: {
    [IdentityComponents.Users]: [props => props.addTail(EntityProp.create({ ... }))],
  },
});
```

And any page can be replaced wholesale by its component key, without forking the module:

```ts
inject(ReplaceableComponentsService).add({
  key: IdentityComponents.Users,
  component: MyUsersPage,
});
```

## What is not here

Three things the Angular UI has that these do not, all because the open source backend has
no endpoint behind them: locking a user out and setting their password from the users
page, per-user two-factor settings, and the resource permission screen. They are not
"to do" — there is nothing to call.
