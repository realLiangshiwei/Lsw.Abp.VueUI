import type { ProviderInput } from '@lsw-abpvue/core';
import {
  TEXT_TEMPLATE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS,
  TEXT_TEMPLATE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
  TEXT_TEMPLATE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS,
  type TextTemplateManagementConfigOptions,
} from '../tokens/extensions.token.js';

/** Registers the module's three extension contribution sets. */
export function provideTextTemplateManagement(
  options: TextTemplateManagementConfigOptions = {},
): ProviderInput[] {
  return [
    {
      provide: TEXT_TEMPLATE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS,
      useValue: options.entityActionContributors ?? {},
    },
    {
      provide: TEXT_TEMPLATE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
      useValue: options.entityPropContributors ?? {},
    },
    {
      provide: TEXT_TEMPLATE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS,
      useValue: options.toolbarActionContributors ?? {},
    },
  ];
}
