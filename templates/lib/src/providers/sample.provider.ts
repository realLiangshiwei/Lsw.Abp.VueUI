import type { ProviderInput } from '@lsw-abpvue/core';
import type { SampleConfigOptions } from '../models/config-options.js';
import {
  SAMPLE_CREATE_FORM_PROP_CONTRIBUTORS,
  SAMPLE_EDIT_FORM_PROP_CONTRIBUTORS,
  SAMPLE_ENTITY_ACTION_CONTRIBUTORS,
  SAMPLE_ENTITY_PROP_CONTRIBUTORS,
  SAMPLE_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

/**
 * The module's providers. They go on the route record, so the contributors are resolved
 * from the injector covering this module's pages and nowhere else.
 * @param options What the host contributes
 */
export function provideSample(options: SampleConfigOptions = {}): ProviderInput[] {
  return [
    { provide: SAMPLE_ENTITY_PROP_CONTRIBUTORS, useValue: options.entityPropContributors ?? {} },
    {
      provide: SAMPLE_CREATE_FORM_PROP_CONTRIBUTORS,
      useValue: options.createFormPropContributors ?? {},
    },
    {
      provide: SAMPLE_EDIT_FORM_PROP_CONTRIBUTORS,
      useValue: options.editFormPropContributors ?? {},
    },
    {
      provide: SAMPLE_ENTITY_ACTION_CONTRIBUTORS,
      useValue: options.entityActionContributors ?? {},
    },
    {
      provide: SAMPLE_TOOLBAR_ACTION_CONTRIBUTORS,
      useValue: options.toolbarActionContributors ?? {},
    },
  ];
}
