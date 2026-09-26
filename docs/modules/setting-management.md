# Setting management

The settings page and its tab tree.

```ts
provideSettingManagementConfig();

lazyRoutes('/setting-management', () =>
  import('@lsw-abpvue/setting-management').then(m => m.createSettingManagementRoutes()),
);
```

| Page | Route | Component key |
| --- | --- | --- |
| Settings | `/setting-management` | `SettingManagement.SettingsComponent` |

## The tabs

The page itself holds nothing: it renders a tab tree that packages contribute to. Two
tabs ship with it — email settings and the time zone — and both are behind the permission
and the feature the backend actually checks.

```ts
provideSettingManagementConfig([
  { name: 'BookStore::Printing', order: 5, component: () => import('./PrintingTab.vue') },
]);
```

A tab's id and its display text are separate: the id is what another package refers to
when it reorders or hides one, and the text is a localization key. The Angular UI uses
the text for both, which makes translating a tab a breaking change for anyone who
referred to it.

## Email settings

The form the backend's `EmailSettingsAppService` describes, plus its "send a test email"
endpoint. The test button is gated on the permission that endpoint actually checks, which
is not the same one as the page.

The tab is not rendered at all for a tenant whose email feature is off — the backend
would refuse every save, and a form that cannot be saved is worse than no form.

## Time zone

Behind ABP's `Abp.Timing.TimeZone` setting, and only shown when the backend has timezone
support switched on.
