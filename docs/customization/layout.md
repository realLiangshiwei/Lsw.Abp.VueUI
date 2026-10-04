# Layouts and navigation

A route chooses `application`, `account` or `empty` through `meta.layout`. Basic Theme registers all three layouts. Application layout supplies the sidebar, navbar, breadcrumb, notification hosts and responsive navigation.

## Branding and appearance

Set `application.name` and optional `application.logoUrl` in the environment. Import Bootstrap CSS, Bootstrap Icons CSS and `@lsw-abpvue/theme-basic/style.css` in that order. Place your application overrides after them.

```css
:root {
  --abp-accent: #2563eb;
  --abp-accent-rgb: 37, 99, 235;
  --abp-accent-hover: #1d4ed8;
  --abp-accent-soft: #eff6ff;
}
```

Basic Theme uses `data-bs-theme` for light and dark modes. Override matching dark values in `[data-bs-theme='dark']` where needed. `useThemeMode()` from `@lsw-abpvue/theme-basic` provides `mode`, `resolved`, `set` and `toggle`; modes are `light`, `dark` and `system`.

## Replace a shell part

Basic Theme uses component keys rather than named layout slots. Register a replacement through `ReplaceableComponentsService` after the theme's initializers.

| Key constant | Part |
| --- | --- |
| `ThemeBasicComponents.Logo` | Logo |
| `ThemeBasicComponents.Routes` | Sidebar navigation |
| `ThemeBasicComponents.NavItems` | Navbar items |
| `ThemeBasicComponents.ApplicationLayout` | Entire application shell |

Add or patch behavioral navbar and user-menu entries through `NavItemsService` and `UserMenuService` from theme-shared. See [replacement](/customization/replacement) and [routing](/concepts/routes-and-menu).
