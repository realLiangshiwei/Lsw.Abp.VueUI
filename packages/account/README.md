# @lsw-abpvue/account

Login, registration, password recovery and the profile page for
[Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an **unofficial** Vue UI
for the [ABP Framework](https://abp.io).

```bash
pnpm add @lsw-abpvue/account
```

```ts
// main.ts: the menu entries, the profile link, at startup
import { provideAccountConfig } from '@lsw-abpvue/account/config';
import { provideManageProfileTabs } from '@lsw-abpvue/account';

provideAccountConfig();
provideManageProfileTabs();
```

```ts
// routes.ts: the pages, on the first navigation into /account
lazyRoutes('/account', () =>
  import('@lsw-abpvue/account').then(module => module.createAccountRoutes()),
);
```

`provideAccountConfig()` also points `NAVIGATE_TO_MANAGE_PROFILE` at `/account/manage`,
so the user menu opens the profile page inside the application instead of the identity
server's own.

## The pages

| | |
| --- | --- |
| `/account/login` | user name or email, password, remember me, and the second factor when ABP asks for one |
| `/account/register` | only while `Abp.Account.IsSelfRegistrationEnabled` is on; signs the new account straight in |
| `/account/forgot-password` | asks ABP to mail a reset link |
| `/account/reset-password` | the link's landing page; no tenant box, because the link belongs to a tenant |
| `/account/manage` | the profile page: change password, personal settings, and whatever else was added |

Every page but the last is behind `authenticationFlowGuard`. With the authorization code
flow the identity server owns them, and asking for one here hands over to it — except the
reset password page, which is reached from a mail whatever the flow is.

## Adding a tab to the profile page

The tabs are a tree in `@lsw-abpvue/account-core`, so a module adds one:

```ts
inject(ManageProfileTabsService).add([
  { name: 'MyModule.SecurityLog', text: 'MyModule::SecurityLog', component: SecurityLog, order: 3 },
]);
```

The module's own two are registered by `provideManageProfileTabs()` under
`ManageProfileTabs.ChangePassword` and `ManageProfileTabs.PersonalSettings`, so they can
be removed or reordered by name.

## Configuration

```ts
createAccountRoutes({
  redirectUrl: '/books',
  appName: 'Vue',
  isPersonalSettingsChangedConfirmationActive: true,
  editFormPropContributors: { [AccountComponents.PersonalSettings]: [addAField] },
});
```

`appName` is the name ABP builds the password reset link for. It has to be one the
backend registered in `AppUrlOptions.Applications`; ABP's own Angular UI sends `Angular`,
and a backend that has never heard of the name cannot send the mail.

## Compared with the Angular UI

Same component keys, same routes, same localization keys. What differs:

| Angular | Here |
| --- | --- |
| The profile page has two tabs written into its template | A tree any module can add a tab to |
| The password validators come from `getPasswordValidators(injector)` | The same rules, plus the required unique characters the server also enforces |
| The login form has no second factor | It has the one the password flow already supported |
| `appName` is `'Angular'` | `'Vue'`, and configurable |

Registered in the design documents' `api-parity-map.md`.

## Licence

MIT.
