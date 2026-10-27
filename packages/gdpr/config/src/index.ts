export { GdprConfigComponents } from './enums/components.js';
export type { AbpCookieConsentOptions, GdprFeature } from './models/options.js';
export { provideGdprConfig, withCookieConsentOptions } from './providers/gdpr-config.provider.js';
export { CookieConsentService, useCookieConsent } from './services/cookie-consent.service.js';
export { default as AbpGdprCookieConsent } from './components/AbpGdprCookieConsent.vue';
export { default as AbpGdprPolicyLinks } from './components/AbpGdprPolicyLinks.vue';
