import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { defineToken } from '@lsw-abpvue/core';
import type { EditionDto, SaasTenantDto } from '@lsw-abpvue/saas/proxy';
import type { SaasComponents } from '../enums/components.js';

interface SaasRecords {
  [SaasComponents.Tenants]: SaasTenantDto;
  [SaasComponents.Editions]: EditionDto;
}

/** Contributions receive the record type belonging to each SaaS page. */
export type SaasEntityPropContributors = {
  [K in keyof SaasRecords]?: EntityPropContributorCallback<SaasRecords[K]>[] | undefined;
};
export type SaasFormPropContributors = {
  [K in keyof SaasRecords]?: FormPropContributorCallback<SaasRecords[K]>[] | undefined;
};
export type SaasEntityActionContributors = {
  [K in keyof SaasRecords]?: EntityActionContributorCallback<SaasRecords[K]>[] | undefined;
};
export type SaasToolbarActionContributors = {
  [K in keyof SaasRecords]?:
    ToolbarActionContributorCallback<readonly SaasRecords[K][]>[] | undefined;
};

export const SAAS_ENTITY_PROP_CONTRIBUTORS = defineToken<SaasEntityPropContributors>(
  'SAAS_ENTITY_PROP_CONTRIBUTORS',
);
export const SAAS_CREATE_FORM_PROP_CONTRIBUTORS = defineToken<SaasFormPropContributors>(
  'SAAS_CREATE_FORM_PROP_CONTRIBUTORS',
);
export const SAAS_EDIT_FORM_PROP_CONTRIBUTORS = defineToken<SaasFormPropContributors>(
  'SAAS_EDIT_FORM_PROP_CONTRIBUTORS',
);
export const SAAS_ENTITY_ACTION_CONTRIBUTORS = defineToken<SaasEntityActionContributors>(
  'SAAS_ENTITY_ACTION_CONTRIBUTORS',
);
export const SAAS_TOOLBAR_ACTION_CONTRIBUTORS = defineToken<SaasToolbarActionContributors>(
  'SAAS_TOOLBAR_ACTION_CONTRIBUTORS',
);
