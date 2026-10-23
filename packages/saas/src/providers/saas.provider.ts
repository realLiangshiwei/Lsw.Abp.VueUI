import type { ProviderInput } from '@lsw-abpvue/core';
import type { SaasConfigOptions } from '../models/config-options.js';
import {
  SAAS_CREATE_FORM_PROP_CONTRIBUTORS,
  SAAS_EDIT_FORM_PROP_CONTRIBUTORS,
  SAAS_ENTITY_ACTION_CONTRIBUTORS,
  SAAS_ENTITY_PROP_CONTRIBUTORS,
  SAAS_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';
import {
  TENANT_FORM_ASYNC_VALIDATORS_TOKEN,
  TENANT_FORM_VALIDATORS_TOKEN,
} from '../tokens/pages.token.js';

/** Registers application contributions and optional tenant form validators. */
export function provideSaas(options: SaasConfigOptions = {}): ProviderInput[] {
  return [
    { provide: SAAS_ENTITY_PROP_CONTRIBUTORS, useValue: options.entityPropContributors ?? {} },
    {
      provide: SAAS_CREATE_FORM_PROP_CONTRIBUTORS,
      useValue: options.createFormPropContributors ?? {},
    },
    { provide: SAAS_EDIT_FORM_PROP_CONTRIBUTORS, useValue: options.editFormPropContributors ?? {} },
    { provide: SAAS_ENTITY_ACTION_CONTRIBUTORS, useValue: options.entityActionContributors ?? {} },
    {
      provide: SAAS_TOOLBAR_ACTION_CONTRIBUTORS,
      useValue: options.toolbarActionContributors ?? {},
    },
    { provide: TENANT_FORM_VALIDATORS_TOKEN, useValue: options.tenantFormValidators ?? [] },
    {
      provide: TENANT_FORM_ASYNC_VALIDATORS_TOKEN,
      useValue: options.tenantFormAsyncValidators ?? [],
    },
  ];
}
