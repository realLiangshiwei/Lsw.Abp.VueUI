export { default as AbpGdprPage } from './components/AbpGdprPage.vue';
export { default as AbpGdprActionColumn } from './components/AbpGdprActionColumn.vue';
export { default as AbpRequestPersonalDataToolbarAction } from './components/AbpRequestPersonalDataToolbarAction.vue';
export { GdprComponents } from './enums/components.js';
export { provideGdpr } from './providers/gdpr.provider.js';
export { createGdprRoutes } from './routes.js';
export { gdprExtensionsResolver } from './resolvers/extensions.resolver.js';
export {
  DEFAULT_GDPR_ENTITY_PROPS,
  DEFAULT_GDPR_TOOLBAR_ACTIONS,
} from './tokens/extensions.token.js';
export type {
  GdprConfigOptions,
  GdprEntityPropContributors,
  GdprToolbarActionContributors,
} from './tokens/extensions.token.js';
export { GDPR_PAGE, type GdprPage } from './tokens/page.token.js';
export {
  DEFAULT_PERSONAL_DATA_ENTITY_PROPS,
  DEFAULT_PERSONAL_DATA_TOOLBAR_ACTIONS,
  DEFAULT_GDPR_ENTITY_PROPS_VALUE,
  DEFAULT_GDPR_TOOLBAR_ACTIONS_VALUE,
} from './defaults/extensions.js';
