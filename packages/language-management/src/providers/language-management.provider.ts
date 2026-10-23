import type { ProviderInput } from '@lsw-abpvue/core';
import {
  LANGUAGE_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS,
  LANGUAGE_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS,
  LANGUAGE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS,
  LANGUAGE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
  LANGUAGE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS,
  type LanguageManagementConfigOptions,
} from '../tokens/extensions.token.js';

/** Registers the module's five extension contribution sets. */
export function provideLanguageManagement(
  options: LanguageManagementConfigOptions = {},
): ProviderInput[] {
  return [
    {
      provide: LANGUAGE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS,
      useValue: options.entityActionContributors ?? {},
    },
    {
      provide: LANGUAGE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
      useValue: options.entityPropContributors ?? {},
    },
    {
      provide: LANGUAGE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS,
      useValue: options.toolbarActionContributors ?? {},
    },
    {
      provide: LANGUAGE_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS,
      useValue: options.createFormPropContributors ?? {},
    },
    {
      provide: LANGUAGE_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS,
      useValue: options.editFormPropContributors ?? {},
    },
  ];
}
