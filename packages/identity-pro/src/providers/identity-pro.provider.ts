import type { ProviderInput } from '@lsw-abpvue/core';
import type { IdentityProConfigOptions } from '../models/config-options.js';
import {
  IDENTITY_PRO_CREATE_FORM_PROP_CONTRIBUTORS,
  IDENTITY_PRO_EDIT_FORM_PROP_CONTRIBUTORS,
  IDENTITY_PRO_ENTITY_ACTION_CONTRIBUTORS,
  IDENTITY_PRO_ENTITY_PROP_CONTRIBUTORS,
  IDENTITY_PRO_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

/** Registers typed commercial page contributors. */
export function provideIdentityPro(options: IdentityProConfigOptions = {}): ProviderInput[] {
  return [
    {
      provide: IDENTITY_PRO_ENTITY_PROP_CONTRIBUTORS,
      useValue: options.entityPropContributors ?? {},
    },
    {
      provide: IDENTITY_PRO_CREATE_FORM_PROP_CONTRIBUTORS,
      useValue: options.createFormPropContributors ?? {},
    },
    {
      provide: IDENTITY_PRO_EDIT_FORM_PROP_CONTRIBUTORS,
      useValue: options.editFormPropContributors ?? {},
    },
    {
      provide: IDENTITY_PRO_ENTITY_ACTION_CONTRIBUTORS,
      useValue: options.entityActionContributors ?? {},
    },
    {
      provide: IDENTITY_PRO_TOOLBAR_ACTION_CONTRIBUTORS,
      useValue: options.toolbarActionContributors ?? {},
    },
  ];
}
