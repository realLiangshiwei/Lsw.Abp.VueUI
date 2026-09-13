# @lsw-abpvue/theme-shared

The theme contract of [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an
**unofficial** Vue UI for the [ABP Framework](https://abp.io). Twelve component
interfaces, the state services behind them, and no UI library of its own.

```bash
pnpm add @lsw-abpvue/theme-shared
```

Applications install a theme rather than this package — `@lsw-abpvue/theme-basic`
includes it. What is here is what `components` and the module packages are written
against, so that swapping the theme swaps every screen and nothing else.

## The twelve contracts

`AbpModal` `AbpToastHost` `AbpConfirmHost` `AbpButton` `AbpFormField` `AbpInput`
`AbpSelect` `AbpToggle` `AbpDatePicker` `AbpTypeahead` `AbpPagination` `AbpSpinner`

Each is exported twice: as its types, and as a component that draws nothing of its own
and forwards to whatever the theme registered.

```vue
<script setup lang="ts">
import { AbpButton, AbpModal } from '@lsw-abpvue/theme-shared';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <AbpButton variant="primary" @click="open = true">Delete</AbpButton>

  <AbpModal v-model:visible="open" size="lg">
    <template #header><h2 class="h5">Are you sure?</h2></template>
    <p>This cannot be undone.</p>
  </AbpModal>
</template>
```

Props, emits and slots are checked: `v-model:visible` is typed, and a size the contract
does not allow is a compile error. Resolution happens in the stand-in's `setup`, so a
page can override one component for its own subtree:

```ts
provideAbp([provideThemeComponents({ AbpButton: MyButton })]);
```

Nothing but Vue is imported here. reka-ui is a set of Vue components and Fluent UI ships
custom elements; whichever one landed in this package would be a dependency the other
theme could never use.

## Services

State only. The theme renders it.

| | |
|---|---|
| `ToasterService` | `success` / `info` / `warn` / `error`, auto-dismiss, containers |
| `ConfirmationService` | asks a question, resolves a `Promise<ConfirmationStatus>` |
| `PageAlertService` | messages that belong to the page rather than floating over it |
| `ErrorPageService` | the failures that end the page |
| `NavItemsService` / `UserMenuService` | the navbar and the dropdown under the user's name |

```ts
const confirmation = inject(ConfirmationService);

if ((await confirmation.warn('Delete this user?', 'Are you sure?')) === ConfirmationStatus.confirm) {
  await users.delete(id);
}
```

## Forms

Vue has no reactive forms, and the extensible form needs one — its fields come from
contributors at runtime rather than from a template.

```ts
const form = useAbpForm({
  userName: { value: '', validators: [Validators.required(), Validators.maxLength(16)] },
  email: { value: '', validators: [Validators.email()] },
});

useServerValidation(form); // a rejected save lands on the fields it was about
```

`form.controls.userName.value` is readable and writable, so `v-model` binds to it
directly. Validators carry ABP's own `AbpValidation::*` localization keys, so a backend
that has been translated translates these messages too.

A password field takes its rules from the backend rather than from the form:

```ts
const form = useAbpForm({
  password: { value: '', validators: [Validators.required(), ...usePasswordValidators()] },
});
```

`Abp.Identity.Password.*` is what the tenant's policy is stored under, and the messages
are the ones ABP's Identity module would have refused the password with.

## Error handling

A chain of handlers, each with a priority and a `canHandle`; the first one that claims an
error takes it. The six built-in ones run at 10, 20, 30, 40, 50 and 99, and an
application slots its own in between:

```ts
provideErrorHandler(MyRateLimitHandler); // priority 35, say
```

## Testing a theme

`@lsw-abpvue/theme-shared/testing` exports the suite every theme runs against itself:

```ts
import { runThemeContractTests } from '@lsw-abpvue/theme-shared/testing';

runThemeContractTests({ name: 'basic', providers: [provideAbpThemeBasic()] });
```

Seventy assertions about behaviour — roles, names, focus, what is emitted, what a
disabled control refuses — plus axe over every contract. It needs `vitest`,
`@vue/test-utils` and `axe-core`, all optional peers.

## Compared with the Angular UI

`@abp/ng.theme.shared` depends on `@ng-bootstrap`, which is a styled component library,
so its contract layer carries an implementation. This one carries none, which is what
makes a second theme possible at all. The full list of differences is in the design
docs' `api-parity-map.md`; the ones that show up in daily use:

| Angular | here |
|---|---|
| `ConfirmationService` returns an `Observable` | returns a `Promise` |
| validation errors are shown in a toast | `setServerErrors()` puts them on the fields |
| handler priority sorts descending, built-ins are not in the chain | ascending, all in one chain |
| `NavItem.html` | `NavItem.component` — no `v-html` anywhere |
| no dark mode, no theme contract tests | both |

## Licence

MIT.
