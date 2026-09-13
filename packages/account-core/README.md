# @lsw-abpvue/account-core

The account logic that has no UI of its own, for [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI),
an **unofficial** Vue UI for the [ABP Framework](https://abp.io).

It exists because two packages need the same answers and neither may depend on the other:
`@lsw-abpvue/account` draws the login and profile pages, and `@lsw-abpvue/theme-basic`
draws the shell they sit in, tenant box included.

```bash
pnpm add @lsw-abpvue/account-core
```

## What is in it

| | |
| --- | --- |
| `AuthWrapperService` | whether this client may show a login form, whether anyone may sign themselves up, whether the tenant is the visitor's to choose |
| `TenantBoxService` | switching the tenant of the current session |
| `ManageProfileTabsService` | the tabs of the profile page, as a tree |
| `ManageProfileStateService` | the profile every tab is editing |
| `AccountComponents` | the replaceable component keys, verbatim from `@abp/ng.account` |

```ts
const wrapper = inject(AuthWrapperService);

if (!wrapper.isLocalLoginEnabled.value) {
  // The client authenticates somewhere else; a password form would collect nothing useful.
}
```

## Adding a tab to the profile page

A module with something to say about the signed-in user adds a tab instead of replacing
the page:

```ts
inject(ManageProfileTabsService).add([
  {
    name: 'MyModule.SecurityLog',
    text: 'MyModule::SecurityLog',
    component: SecurityLogTab,
    order: 3,
    requiredPolicy: 'MyModule.SecurityLog',
  },
]);
```

The tree filters by permission and by the tab's own `visible()`, so a tab appears the
moment a login grants its policy. `ManageProfileStateService` holds the profile the page
loaded, so a tab reads and writes the same one the other tabs do.

## Switching tenant

```ts
const found = await inject(TenantBoxService).switchTo('acme');
```

`false` means no tenant goes by that name, and the session is left as it was. Saying so
is the caller's business: the service raises no toast, because a toast is a theme.

## `@lsw-abpvue/account-core/proxy`

The generated proxy of ABP's `Volo.Abp.Account` module — `AccountService`,
`ProfileService`, and the DTOs they carry. Written by `abpvue proxy add --module account`
and checked in; a change in it in a pull request is a change in the backend's API.

## Compared with the Angular UI

`@abp/ng.account.core` has the first two services and nothing else. The differences:

| Angular | Here |
| --- | --- |
| `TenantBoxService` raises a toast itself, so the package depends on `@abp/ng.theme.shared` | `switchTo` answers `false` and the caller says so; the package depends on `core` alone |
| A failed lookup clears the tenant that was set | The session is left as it was |
| The profile page has two tabs, written into its template | A tree any module can add a tab to |
| The `Account.*` component keys live in `@abp/ng.account` | Here, so the theme can name the two it renders |

Registered in the design documents' `api-parity-map.md`.

## Licence

MIT.
