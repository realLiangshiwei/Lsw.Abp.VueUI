import type { ProviderInput } from '@lsw-abpvue/core';
import {
  OPENIDDICT_PRO_CREATE_FORM_PROP_CONTRIBUTORS,
  OPENIDDICT_PRO_EDIT_FORM_PROP_CONTRIBUTORS,
  OPENIDDICT_PRO_ENTITY_ACTION_CONTRIBUTORS,
  OPENIDDICT_PRO_ENTITY_PROP_CONTRIBUTORS,
  OPENIDDICT_PRO_TOOLBAR_ACTION_CONTRIBUTORS,
  type OpenIddictProConfigOptions,
} from '../tokens/extensions.token.js';

/** Registers the module's five extension contribution sets. */
export function provideOpenIddictPro(options: OpenIddictProConfigOptions = {}): ProviderInput[] {
  return [
    {
      provide: OPENIDDICT_PRO_ENTITY_ACTION_CONTRIBUTORS,
      useValue: options.entityActionContributors ?? {},
    },
    {
      provide: OPENIDDICT_PRO_ENTITY_PROP_CONTRIBUTORS,
      useValue: options.entityPropContributors ?? {},
    },
    {
      provide: OPENIDDICT_PRO_TOOLBAR_ACTION_CONTRIBUTORS,
      useValue: options.toolbarActionContributors ?? {},
    },
    {
      provide: OPENIDDICT_PRO_CREATE_FORM_PROP_CONTRIBUTORS,
      useValue: options.createFormPropContributors ?? {},
    },
    {
      provide: OPENIDDICT_PRO_EDIT_FORM_PROP_CONTRIBUTORS,
      useValue: options.editFormPropContributors ?? {},
    },
  ];
}
