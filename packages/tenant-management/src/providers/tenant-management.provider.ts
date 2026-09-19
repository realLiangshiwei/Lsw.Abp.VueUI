import type { ProviderInput } from '@lsw-abpvue/core';
import type { TenantManagementConfigOptions } from '../models/config-options.js';
import {
  TENANT_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS,
  TENANT_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS,
  TENANT_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS,
  TENANT_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
  TENANT_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

/**
 * The module's providers. They go on the route record, so the contributors are resolved
 * from the injector covering the module's own page and nowhere else.
 * @param options What the host contributes
 */
export function provideTenantManagement(
  options: TenantManagementConfigOptions = {},
): ProviderInput[] {
  return [
    {
      provide: TENANT_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
      useValue: options.entityPropContributors ?? {},
    },
    {
      provide: TENANT_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS,
      useValue: options.createFormPropContributors ?? {},
    },
    {
      provide: TENANT_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS,
      useValue: options.editFormPropContributors ?? {},
    },
    {
      provide: TENANT_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS,
      useValue: options.entityActionContributors ?? {},
    },
    {
      provide: TENANT_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS,
      useValue: options.toolbarActionContributors ?? {},
    },
  ];
}
