# Branding and navigation

The Basic Theme shell renders the menu registered by Core, navbar items from theme-shared and a user menu whose account/logout actions are configured by the account and OAuth providers. Customize the smallest part that meets your requirement.

## Change the configured brand

Set `application.name` and `application.logoUrl` in `public/dynamic-env.json` and place a logo under `public/brand.svg`. Use its actual deployed path, including a subpath when applicable. The configured logo keeps the theme's default home link and responsive shell. Import application CSS after the Basic Theme styles.

## Create a custom logo and navbar component

Create `src/components/BrandLogo.vue`:

<<< ../examples/BrandLogo.vue

Create `src/components/HelpNavItem.vue`:

<<< ../examples/HelpNavItem.vue

The navbar component renders its own list item, RouterLink and badge. It owns navigation and accessible text. A custom navbar component replaces the ordinary item rendering; it is not a string of HTML passed through a resolver.

## Register the changes

Create `src/custom-navigation.ts`, changing the component imports to `./components/BrandLogo.vue` and `./components/HelpNavItem.vue`:

<<< ../examples/custom-navigation.ts

Import `customNavigation` in `src/main.ts` and place it after router, theme and module configuration providers. Keep the existing Core/OAuth/account setup. Add `/help` and `/activity` route records to the existing route array; a menu entry does not create a route. Add BookStore texts for Support, Help, New and Activity.

The example creates a Support group with a Help child, moves Identity to order 10, inserts the navbar Help component and adds My activity only while authenticated. Its user-menu action explicitly pushes the route through the router. My account's patch changes its icon and preserves the account provider's destination.

## Add, patch, remove and reorder

RoutesService uses stable `name` values for identity; `parentName` sets hierarchy and `order` sets sibling order. Patching the label's localization resource does not rename the item. Register after the module whose item you change.

```ts
const routes = inject(RoutesService);
routes.patch('BookStore::Help', { order: 2 });
routes.remove(['BookStore::Support']);
```

Removing a parent also removes its descendants. Use this as an alternative customization, not in addition to the initializer above unless you intentionally want Help removed. The registered route remains navigable unless you remove it or its guard rejects access.

NavItemsService and UserMenuService also support add, patch and remove. Nav items with a Vue `component` implement their own rendering; ordinary command items should use `action`. Do not assume assigning a `path` makes every theme's navbar render a RouterLink. Use a component for a link, or a router action for a command.

A `visible` callback must synchronously read reactive state. `requiredPolicy` adds permission filtering but never replaces server authorization. Obtain services in the initializer before entering an asynchronous callback.

## Replace another shell part

| Key | Part |
| --- | --- |
| `ThemeBasicComponents.Logo` | Home link and brand |
| `ThemeBasicComponents.Routes` | Sidebar navigation |
| `ThemeBasicComponents.NavItems` | Navbar items |
| `ThemeBasicComponents.ApplicationLayout` | Whole application shell |

Register with ReplaceableComponentsService after default theme registrations. These parts use public component keys rather than arbitrary named layout slots. See [replacement](/customization/replacement).

A complete shell must retain route content, notifications, confirmation, page alerts, breadcrumbs and the selected language/user controls. Replacing the shell does not remove the underlying menu or authentication services.

## Check the result

Open Help from both the sidebar and navbar. Sign out: My activity must disappear. Sign in: it returns, and My account/logout keep their configured behavior. Check the changed Identity order, long application names, collapsed sidebar, narrow screens, dark mode and RTL.

Missing changes usually mean the initializer runs before default registrations, its module is not enabled, or the item name is wrong. A visible but inert custom item needs an actual link/action, not only a label. Do not patch business-page CSS to repair a shell layout problem.
