# Routes and the menu

The menu is the routes. A module registers navigation items at startup, and the tree they
form is what the layout renders — filtered by what the current user may see.

## A page declares its own entry

```ts
{
  path: '/books',
  component: () => import('./pages/BooksPage.vue'),
  meta: {
    title: 'BookStore::Menu:Books',
    requiredPolicy: 'BookStore.Books',
    routes: { name: 'BookStore::Menu:Books', order: 2, iconClass: 'bi bi-book' },
  },
}
```

`meta.routes` is the menu entry. `requiredPolicy` does two jobs at once: the guard turns
an unauthorized visitor away, and the entry stays out of the menu.

## A module registers its own

A module's pages arrive on the first navigation into them, but its menu has to be there at
startup — which is why every module has a `/config` entry point holding nothing but this:

```ts
provideAppInitializer(() => {
  inject(RoutesService).add([
    {
      name: TenantManagementRouteNames.TenantManagement,
      parentName: ThemeSharedRouteNames.Administration,
      requiredPolicy: TenantManagementPolicyNames.TenantManagement,
      iconClass: 'bi bi-people',
      layout: LayoutType.application,
      order: 2,
    },
  ]);
});
```

It imports no component, so an application that never opens tenant management still gets
its menu for a few hundred bytes.

## Changing what a module registered

```ts
const routes = inject(RoutesService);

routes.patch('AbpTenantManagement::Menu:TenantManagement', { order: 10 });
routes.remove(['AbpIdentity::Menu:Identity']);
routes.removeByParam({ parentName: 'AbpUiNavigation::Menu:Administration' });
```

`flat`, `tree` and `visible` are the three readings of it: everything, everything as a
tree, and the tree this user may see.

## Lazy module routes

```ts
lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(contributors)),
);
```

`lazyRoutes` is `loadChildren` for `vue-router`: the module's route records are added on
the first navigation into the prefix, and the extension contributors the host passes go in
at the same time.

## Resolvers

```ts
{
  path: '/identity',
  component: AbpRouterOutlet,
  beforeEnter: [withResolvers([identityExtensionsResolver])],
  meta: { providers: provideIdentity(options), requiresAuthentication: true },
}
```

`AbpRouterOutlet` establishes a route-level injector from `meta.providers`, and
`withResolvers` runs what has to finish before the page renders — for a module page, the
assembly of its extension points.

## Layouts

`meta.layout` picks one of ABP's three: `application`, `account` and `empty`. The theme
provides all three and `AbpDynamicLayout` switches between them, so a route says which
one it wants rather than nesting itself under a component.
