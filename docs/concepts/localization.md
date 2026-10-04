# Localization

The texts come from the backend, in the resources ABP already ships. Nothing has to be
duplicated in the frontend.

## In a template

```vue
<h1>{{ $t('AbpIdentity::Users') }}</h1>
<p>{{ $t('AbpIdentity::UserDeletionConfirmationMessage', user.userName) }}</p>
```

`$t` is a global property and reactive by itself: switching language re-renders whatever
used it. There is no pipe, and no layout is torn down and rebuilt to change language.

## Outside one

```ts
const localization = inject(LocalizationService);

localization.t('AbpUi::Save');                  // the text now
localization.tr('AbpUi::Save');                 // ComputedRef<string>, for outside templates
await localization.setLanguage('tr');
localization.currentLang.value;                 // 'tr'
localization.languages.value;                   // what the backend offers
```

## Keys

`Resource::Key` is ABP's own shape, and the resources are the backend's:
`AbpIdentity::Users`, `AbpUi::Save`, `AbpValidation::ThisFieldIsRequired.`. The default resource is the backend configuration's `localization.defaultResourceName`.

A key with no text is returned as it is, with a warning in development. That is deliberate:
the alternative is an empty screen where a missing translation should be visible.

## A default, for a key that may not exist

```ts
$t({ key: 'BookStore::Reprint', defaultValue: 'Reprint' });
```

Useful for a package that has to work against a backend whose resource has not been
extended yet.

## Texts the frontend ships

```ts
provideAbpCore(
  withOptions({ environment }),
  withLocalizations([
    { culture: 'en', resources: [{ resourceName: 'BookStore', texts: { Reprint: 'Reprint' } }] },
  ]),
);
```

They win over the backend's for the same key, which is what makes overriding one text
possible without touching the server.

## Right to left

The culture's direction comes from the localization configuration, so switching to Arabic
switches the layout. The theme does the rest.
