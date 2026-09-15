import type { ProviderInput } from '@lsw-abpvue/core';
import type { IdentityConfigOptions } from '../models/config-options.js';
import {
  IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS,
  IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS,
  IDENTITY_ENTITY_ACTION_CONTRIBUTORS,
  IDENTITY_ENTITY_PROP_CONTRIBUTORS,
  IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

/**
 * The module's providers. They go on the route record, so the contributors are resolved
 * from the injector covering the module's own pages and nowhere else.
 * @param options What the host contributes
 */
export function provideIdentity(options: IdentityConfigOptions = {}): ProviderInput[] {
  return [
    { provide: IDENTITY_ENTITY_PROP_CONTRIBUTORS, useValue: options.entityPropContributors ?? {} },
    {
      provide: IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS,
      useValue: options.createFormPropContributors ?? {},
    },
    {
      provide: IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS,
      useValue: options.editFormPropContributors ?? {},
    },
    {
      provide: IDENTITY_ENTITY_ACTION_CONTRIBUTORS,
      useValue: options.entityActionContributors ?? {},
    },
    {
      provide: IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS,
      useValue: options.toolbarActionContributors ?? {},
    },
  ];
}
