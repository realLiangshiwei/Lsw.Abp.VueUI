# @lsw-abpvue/theme-basic

The default theme of [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an
**unofficial** Vue UI for the [ABP Framework](https://abp.io). The twelve contracts of
`@lsw-abpvue/theme-shared` implemented with [reka-ui](https://reka-ui.com) for behaviour
and Bootstrap 5 for looks, plus the three layouts an ABP application is rendered in.

```bash
pnpm add @lsw-abpvue/theme-basic bootstrap bootstrap-icons
```

reka-ui brings `vue-demi` with it (through `@floating-ui/vue`), and `vue-demi` writes its
Vue 2 / Vue 3 shim in a postinstall script. pnpm asks before running one, so allow it:

```yaml
# pnpm-workspace.yaml
allowBuilds:
  vue-demi: true
```

## Setup

```ts
import { createAbpApp, provideAbpCore, withOptions } from '@lsw-abpvue/core';
import { provideAbpRouter } from '@lsw-abpvue/core/router';
import { provideAbpThemeBasic } from '@lsw-abpvue/theme-basic';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@lsw-abpvue/theme-basic/style.css';

const { mount } = await createAbpApp(App, {
  providers: [
    provideAbpCore(withOptions({ environment })),
    provideAbpRouter(routes),
    provideAbpThemeBasic(),
  ],
});
```

The application component is the layout switch and nothing else:

```vue
<template>
  <AbpDynamicLayout :default-layout="LayoutType.application">
    <RouterView />
  </AbpDynamicLayout>
</template>
```

Bootstrap's CSS only. Its JavaScript is never loaded — dialogs, dropdowns, selects and
pagination are reka-ui, which brings the focus management, the ARIA and the keyboard
handling with it.

## The three layouts

| | |
|---|---|
| `Theme.ApplicationLayoutComponent` | sidebar, navbar, breadcrumb, the page |
| `Theme.AccountLayoutComponent` | a centred card, for login and register |
| `Theme.EmptyLayoutComponent` | the page, and the toast and dialog hosts |

The menu is `RoutesService.groupedVisible` rendered directly: already filtered by policy,
sorted and grouped, so a route whose permission was just granted appears on its own.
Collapsed state is remembered; under 992px the sidebar becomes a drawer.

Every piece is registered through `ReplaceableComponentsService`, so a host replaces one
without forking the theme:

```ts
replaceable.add({ key: ThemeBasicComponents.Logo, component: MyLogo });
```

## Dark mode and right to left

Dark mode is Bootstrap's own `data-bs-theme`, set by `ThemeModeService`, which follows
the operating system until someone chooses and then remembers the choice. The navbar
carries a toggle for it.

Right to left follows the language: ABP says which cultures read that way, and
`DirectionService` puts `dir` on the document when one is chosen. The theme's own styles
use logical properties throughout, so nothing else has to know.

## Theming

Everything themable is a custom property, and no component style names a colour:

```css
:root {
  --abp-sidebar-width: 18rem;
  --abp-sidebar-bg: var(--bs-body-bg);
  --abp-loader-bar-color: rebeccapurple;
}
```

## Contract tests

The theme runs the suite `theme-shared` exports, which is the definition of done for any
theme:

```ts
import { runThemeContractTests } from '@lsw-abpvue/theme-shared/testing';
import { provideAbpThemeBasic } from '@lsw-abpvue/theme-basic';

runThemeContractTests({ name: 'basic', providers: [provideAbpThemeBasic()] });
```

## Compared with the Angular UI

`@abp/ng.theme.basic` is the same three layouts against the same component keys, so a
host that replaces `Theme.ApplicationLayoutComponent` there replaces it here. What is
different: dark mode exists (in the Angular UI it is what LeptonX is for), the icons are
Bootstrap Icons rather than Font Awesome, and none of Bootstrap's JavaScript is shipped.

## Licence

MIT. Bootstrap and Bootstrap Icons are MIT; reka-ui is MIT.
