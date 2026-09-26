# Themes

Two layers: `theme-shared` is the contract and has **no UI dependency at all**, and a
theme package implements it.

## The contract

Twelve components, by key:

```
AbpModal      AbpToastHost   AbpConfirmHost   AbpButton
AbpFormField  AbpInput       AbpSelect        AbpToggle
AbpDatePicker AbpTypeahead   AbpPagination    AbpSpinner
```

Everything above the theme — the module UIs, the extensible table and form, your own
pages — imports these from `@lsw-abpvue/theme-shared` and gets whatever the application
registered.

```ts
import { AbpButton, AbpModal } from '@lsw-abpvue/theme-shared';
```

## Why the contract layer has no UI dependency

`theme-basic` is built on reka-ui, which is Vue components. A theme built on Web
Components would be a different kind of thing entirely. If either of them were a
dependency of the contract layer, every application using the other would carry it for
nothing — so the contract layer has neither, and each theme brings its own.

The proof that the line is in the right place: two unrelated implementations —
`theme-basic` (reka-ui with Bootstrap 5) and a plain reference theme built from native
elements only — pass the same 70 behavioural assertions with `theme-shared` unchanged.

## Registering a theme

```ts
provideAbpThemeBasic();
```

Or a component at a time, which is how you replace one of the twelve without forking a
theme:

```ts
provideThemeComponents({ AbpDatePicker: MyDatePicker });
```

## Layouts and slots

A theme provides three layouts — `application`, `account` and `empty` — and a set of
slots inside them: the brand, the navbar items, the user menu, the language switcher, the
breadcrumb. A host fills a slot rather than replacing the layout.

Replaceable components go further: any page can be swapped by its component key, which is
how a module's page is replaced wholesale without forking the module.

```ts
replaceable.add({ key: IdentityComponents.Users, component: MyUsersPage });
```

## Testing a theme

```ts
import { runThemeContractTests } from '@lsw-abpvue/theme-shared/testing';

runThemeContractTests(myTheme);
```

Seventy assertions about behaviour rather than markup: Esc closes a modal, focus returns
to what opened it, arrow keys move through a select, `aria-expanded` flips both ways,
a disabled control is not interactive. Plus axe-core over every contract component.

A theme that passes them is a theme every module UI works on.

## Dark mode and RTL

Both are the theme's, and `theme-basic` has them. Dark mode follows the OS by default and
can be set explicitly; RTL follows the culture's direction from the localization
configuration, so switching to Arabic switches the layout.
