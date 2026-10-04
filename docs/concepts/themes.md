# Themes

`theme-shared` defines UI contracts and feedback services without depending on a UI library. `theme-basic` implements those contracts with Bootstrap styles and Vue controls.

## Register and import

```ts
import { provideAbpThemeBasic } from '@lsw-abpvue/theme-basic';
import { AbpButton, AbpModal } from '@lsw-abpvue/theme-shared';

const theme = provideAbpThemeBasic();
```

Add `theme` to startup providers. Module pages import controls from theme-shared; they never depend directly on a theme implementation. Import Bootstrap, icons and Basic Theme styles in the order shown in [startup](/development/startup).

## Contracts

Twelve controls cover button, input, select, toggle, form field, date picker, typeahead, modal, pagination, spinner, toast host and confirmation host. Their props, events and slots are listed in [components](/components/).

Replace a single control with `provideThemeComponents`. Replace the application shell or its logo and navigation with `ReplaceableComponentsService` and theme component keys. Layout parts do not expose an arbitrary set of named slots; see [layout customization](/customization/layout).

## Modal behavior

`AbpModal` guards user close paths. Native input events or an explicit `dirty` flag can trigger unsaved-change confirmation. `busy` blocks user closing. Cancel uses the footer slot's `close()`; successful save sets visibility to false directly. [Modal reference](/components/modal) documents lifecycle events and accessibility.

## Theme testing

A custom implementation can use `runThemeContractTests` from `@lsw-abpvue/theme-shared/testing` to check keyboard interaction, focus, disabled state and accessible behavior. Passing a suite does not replace visual review of your own theme.

Basic Theme supports light, dark and system modes, and follows localization direction for RTL. The generated application is a client SPA; platform-safe core services do not constitute a full server-rendered theme template.

[Write a theme](/customization/create-theme).
