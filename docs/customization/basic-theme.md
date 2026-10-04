# Basic Theme

Basic Theme is the Bootstrap implementation of the shared UI contracts. Generated applications register it by default. Business modules use theme-shared controls and remain independent of the selected implementation.

## Install and register

For a manually configured application, install the theme and its styles:

```bash
pnpm add @lsw-abpvue/theme-basic@alpha bootstrap bootstrap-icons
```

In `src/main.ts`, keep the Core and router providers and add the theme provider:

```ts
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@lsw-abpvue/theme-basic/style.css';
import { provideAbpThemeBasic } from '@lsw-abpvue/theme-basic';

const theme = provideAbpThemeBasic();
```

Put `theme` in the providers array passed to `createAbpApp`. Do not register it a second time in a generated application. Add application style overrides after these imports.

## What the theme provides

The provider installs twelve shared controls, application/account/empty layouts, and the default feedback/error presentation. The application layout renders the route outlet, sidebar, navbar, breadcrumbs, page alerts, toasts and confirmation host. Replacing the layout makes those hosts your responsibility.

Route `meta.layout` selects a layout; changing a route's layout does not change its authentication guard. The account layout is for local account pages. With authorization-code authentication, Login can still redirect to an external authorization server.

## Brand and color

Set `application.name` and `application.logoUrl` in runtime configuration. Put a local image under `public/` and reference its deployed URL. For `/portal/`, use `/portal/brand.svg`, not an origin-root path that bypasses the application base.

Override `--abp-accent`, `--abp-accent-rgb`, `--abp-accent-hover` and `--abp-accent-soft` in application CSS. Define dark overrides under `[data-bs-theme='dark']`. These tokens affect the theme; arbitrary third-party widgets still need their own styles.

## Light, dark and system mode

```ts
import { useThemeMode } from '@lsw-abpvue/theme-basic';

const themeMode = useThemeMode();
const useSystemTheme = () => themeMode.set('system');
const toggleTheme = () => themeMode.toggle();
```

Call this inside setup. `mode` is the selected preference; `resolved` is the effective light/dark mode. System follows the operating system. The theme reads and writes the browser preference; localizing text is a separate concern.

## Customize at the appropriate level

For visual changes, begin with configuration and CSS. For a logo/navbar component, use [branding and navigation](/customization/layout). For a shared input or modal, use [component replacement](/customization/replacement) and preserve its public contract. To supply a whole implementation, follow [write a theme](/customization/create-theme).

Check long labels, collapsed navigation, a narrow viewport, keyboard focus and RTL after changing the shell. [Component guides](/components/) show the actual control behavior; Bootstrap classes alone do not implement that behavior.
