export { default as SamplePage } from './components/SamplePage.vue';

export {
  DEFAULT_SAMPLE_ENTITY_ACTIONS,
  DEFAULT_SAMPLE_ENTITY_PROPS,
  DEFAULT_SAMPLE_FORM_PROPS,
  DEFAULT_SAMPLE_TOOLBAR_ACTIONS,
} from './defaults/sample.js';

export { SampleComponents } from './enums/components.js';
export type { SampleComponent } from './enums/components.js';

export type { SampleDto } from './models/sample.js';
export type { SampleConfigOptions } from './models/config-options.js';

export { provideSample } from './providers/sample.provider.js';

export { sampleExtensionsResolver } from './resolvers/extensions.resolver.js';

export { createSampleRoutes } from './routes.js';

export {
  SAMPLE_CREATE_FORM_PROP_CONTRIBUTORS,
  SAMPLE_EDIT_FORM_PROP_CONTRIBUTORS,
  SAMPLE_ENTITY_ACTION_CONTRIBUTORS,
  SAMPLE_ENTITY_PROP_CONTRIBUTORS,
  SAMPLE_PAGE,
  SAMPLE_TOOLBAR_ACTION_CONTRIBUTORS,
} from './tokens/extensions.token.js';
export type {
  SampleEntityActionContributors,
  SampleEntityPropContributors,
  SampleFormPropContributors,
  SamplePageCommands,
  SampleToolbarActionContributors,
} from './tokens/extensions.token.js';
