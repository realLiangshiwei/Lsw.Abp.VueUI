# Localization

The backend supplies resources, available cultures and current culture through application configuration/localization. The UI can also ship application-specific text. Use resource keys in UI logic and translate at rendering time.

## Translate a complete page

Create `src/pages/Catalogue.vue`:

<<< ../examples/LocalizationExample.vue

This example needs backend cultures `en` and `zh-Hans`. Choose the actual names in `localization.languages`; `zh`, `zh-CN` and `zh-Hans` are not interchangeable configuration entries. Switching culture makes a localization request, so this example runs in your application rather than the offline component preview.

## Add frontend texts

Create `src/localization.ts`:

<<< ../examples/localization-texts.ts

Import `catalogueTexts` and pass it to `provideAbpCore(withOptions({ environment }), catalogueTexts)` in startup. With the backend configured for the same cultures, the heading and parameterized count update without remounting the page. Frontend entries win over backend entries with the same resource/key.

Keep domain terminology shared by backend and clients in the backend resource. Frontend-only page labels can live in shipped text. Register overrides intentionally rather than duplicating every backend resource.

## Key lookup and fallback

Use `BookStore::Catalogue` for an explicit resource and `::Catalogue` for the configured default resource. The configuration's `localization.defaultResourceName` controls that default. A missing translation returns its key and warns in development, making a missing resource visible.

For an optional package label, use `{ key: 'BookStore::Reprint', defaultValue: 'Reprint' }` where the receiving contract accepts `LocalizationParam`. Not all label props do: action labels and `AbpPage.title` are string keys, while input/option labels are already translated text.

`{0}`, `{1}` placeholders accept positional parameters. Do not concatenate translated sentence fragments, and do not inject translations as raw HTML.

## Reactive versus current text

| Call | Result and use |
| --- | --- |
| `$t(key, ...params)` | Reactive template text |
| `localization.t(key, ...params)` | A string at the time of the call |
| `localization.tr(key, ...params)` | Computed text outside a template |
| `currentLang` / `languages` | Computed current culture / available cultures |
| `setLanguage(culture)` | Persists selection and loads that culture's texts |

For table headers and option arrays, use computed around t. A header computed once at module import will not follow a language change. Capture the service during setup; do not call inject after an await.

## Runtime JSON and locale hooks

`withOptions({ environment, uiLocalization: { enabled: true, basePath: '/assets/localization' } })` enables files such as `/assets/localization/en.json`. Their shape is `{ "BookStore": { "Catalogue": "Catalogue" } }`: resources at the top level, texts beneath. A missing culture file is ignored and backend texts remain available. Serve these files as JSON, without an SPA HTML fallback.

Use `withRegisterLocale` when another library needs an asynchronous locale-registration hook. Native Intl formatting needs a locale name, not an imported registration module. Format dates and numbers separately from translating their surrounding sentence.

## Direction and diagnosis

Basic Theme derives direction from the current culture configuration. Check labels, dropdown alignment and keyboard movement in a right-to-left culture. If a key remains visible, check resource name, culture name, backend texts, shipped overrides and the request response. If a label stays in the previous language, move its translation into a reactive computed. See [dates](/utilities/dates) and [configuration](/guide/configuration).
