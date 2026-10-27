# @lsw-abpvue/gdpr

Personal data requests and cookie consent for ABP applications. Uses the official
GDPR endpoints and localization resources; requires a backend with the GDPR module.

Register navigation and cookie options at startup:

```ts
import { provideGdprConfig, withCookieConsentOptions } from '@lsw-abpvue/gdpr/config';

provideGdprConfig(withCookieConsentOptions({
  cookiePolicyUrl: '/cookie-policy',
  privacyPolicyUrl: '/privacy-policy',
}));
```

Mount `AbpGdprCookieConsent` from `/config` in the application shell and import
`@lsw-abpvue/gdpr/style.css`. Consent uses `.AspNet.Consent` with a six-month expiry
by default. Set `isEnabled: false` to disable the banner.

Load the personal data page with `createGdprRoutes()` from the main entry, or
`lazyRoutes('/gdpr', () => import('@lsw-abpvue/gdpr').then(m => m.createGdprRoutes()))`.

`Gdpr.GdprComponent` and `Gdpr.CookieConsentComponent` are replaceable. The page
supports object-extension columns and typed toolbar contributions. Its column
contributors retain Angular's `createFormPropContributors` option name.
`GDPR_PAGE` exposes the page workflows to custom cells and toolbar actions.

Preparation delays, request intervals and download-token validity are enforced by
the backend. Deletion asks for confirmation and acknowledges the deletion request.
