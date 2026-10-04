# Write a theme

A theme implements the theme-shared contracts and registers application layouts. Its UI-library dependencies belong in the theme package; keep them out of theme-shared and business modules.

## 1. Implement controls

Implement all twelve entries from `ABP_COMPONENT_KEYS`. Import their public props, emits and slots types from theme-shared. [Component references](/components/) define the contract and describe Basic Theme defaults.

Preserve controlled values and events, disabled/read-only state, label relationships and keyboard behavior. For modal closing, use `useModal` to share busy and unsaved-change handling, and expose its guarded close through the footer slot. Date controls must retain the DTO's string representation unless the user edits it.

## 2. Register the theme

This provider accepts your twelve controls and three layout components. It uses only core and theme-shared contracts:

<<< ../examples/custom-theme.ts

Pass its result to the application's provider array instead of `provideAbpThemeBasic()`. The standard dynamic-layout map uses those exact three keys; a different map can be supplied through `DYNAMIC_LAYOUTS` from core/router.

## 3. Supply a shell

Layouts receive page content through their default slot. Application layout should render the navigation and current route content and include `AbpToastHost` and `AbpConfirmHost`. Account layout needs space for the authentication pages; empty layout can simply render its slot. Use `RoutesService`, `NavItemsService` and `UserMenuService` for shared navigation behavior.

Handle RTL, small viewports, overlay focus, reduced motion and high contrast in your implementation. CSS and icons ship with your theme.

## 4. Validate

Use `runThemeContractTests` from `@lsw-abpvue/theme-shared/testing` with the test harness's `ThemeUnderTest` adapter. Review focus restoration, Escape, disabled actions, input validation and accessible names. Then open the built-in module pages with the theme and inspect both directions and small screens.

For a small visual change, [CSS and shell customization](/customization/layout) or [one-control replacement](/customization/replacement) may cover the requirement.
