# Account

The pages a visitor sees before they are signed in, and the profile page after.

```ts
provideAccountConfig();
provideManageProfileTabs();

lazyRoutes('/account', () =>
  import('@lsw-abpvue/account').then(m => m.createAccountRoutes()),
);
```

| Page | Route | Component key |
| --- | --- | --- |
| Login | `/account/login` | `Account.LoginComponent` |
| Register | `/account/register` | `Account.RegisterComponent` |
| Forgot password | `/account/forgot-password` | `Account.ForgotPasswordComponent` |
| Reset password | `/account/reset-password` | `Account.ResetPasswordComponent` |
| Manage profile | `/account/manage-profile` | `Account.ManageProfileComponent` |

The login page is only reached in the password flow. With `responseType: 'code'` the
visitor goes to the identity server instead, and these pages are dead weight the bundler
removes.

## Two factor

The login page handles ABP's second step itself: a first attempt that comes back with
`TwoFactorRequiredError` shows the code field, and the second carries `twoFactorProvider`
and `twoFactorCode`. The Angular UI needs the commercial account module for this.

## The profile page's tabs

```ts
provideManageProfileTabs([
  { name: 'BookStore::ApiKeys', order: 3, component: () => import('./ApiKeysTab.vue') },
]);
```

The tab tree is a contributor point, so a package can add a tab to the profile page. The
two the module ships — personal details and change password — are entries in the same
tree and can be reordered or hidden.

## `account-core`

The half both the account pages and a theme need: the tenant box on the login page, the
profile state, and the tab tree. A theme depends on `account-core`, never on `account` —
the login form is a page, and the tenant switcher is a piece of chrome.
