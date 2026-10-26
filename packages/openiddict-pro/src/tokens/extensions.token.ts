import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { defineToken } from '@lsw-abpvue/core';
import type { ApplicationDto, ScopeDto } from '@lsw-abpvue/openiddict-pro/proxy';
import type { OpenIddictProComponents } from '../enums/components.js';

interface OpenIddictProRecords {
  [OpenIddictProComponents.Applications]: ApplicationDto;
  [OpenIddictProComponents.Scopes]: ScopeDto;
}

/** Contributions retain the DTO type belonging to each official component key. */
export type OpenIddictProEntityActionContributors = {
  [K in keyof OpenIddictProRecords]?:
    EntityActionContributorCallback<OpenIddictProRecords[K]>[] | undefined;
};
export type OpenIddictProEntityPropContributors = {
  [K in keyof OpenIddictProRecords]?:
    EntityPropContributorCallback<OpenIddictProRecords[K]>[] | undefined;
};
export type OpenIddictProToolbarActionContributors = {
  [K in keyof OpenIddictProRecords]?:
    ToolbarActionContributorCallback<readonly OpenIddictProRecords[K][]>[] | undefined;
};
export type OpenIddictProCreateFormPropContributors = {
  [K in keyof OpenIddictProRecords]?:
    FormPropContributorCallback<OpenIddictProRecords[K]>[] | undefined;
};
export type OpenIddictProEditFormPropContributors = OpenIddictProCreateFormPropContributors;

export interface OpenIddictProConfigOptions {
  entityActionContributors?: OpenIddictProEntityActionContributors | undefined;
  entityPropContributors?: OpenIddictProEntityPropContributors | undefined;
  toolbarActionContributors?: OpenIddictProToolbarActionContributors | undefined;
  createFormPropContributors?: OpenIddictProCreateFormPropContributors | undefined;
  editFormPropContributors?: OpenIddictProEditFormPropContributors | undefined;
}

export const OPENIDDICT_PRO_ENTITY_ACTION_CONTRIBUTORS =
  defineToken<OpenIddictProEntityActionContributors>('OPENIDDICT_PRO_ENTITY_ACTION_CONTRIBUTORS');
export const OPENIDDICT_PRO_ENTITY_PROP_CONTRIBUTORS =
  defineToken<OpenIddictProEntityPropContributors>('OPENIDDICT_PRO_ENTITY_PROP_CONTRIBUTORS');
export const OPENIDDICT_PRO_TOOLBAR_ACTION_CONTRIBUTORS =
  defineToken<OpenIddictProToolbarActionContributors>('OPENIDDICT_PRO_TOOLBAR_ACTION_CONTRIBUTORS');
export const OPENIDDICT_PRO_CREATE_FORM_PROP_CONTRIBUTORS =
  defineToken<OpenIddictProCreateFormPropContributors>(
    'OPENIDDICT_PRO_CREATE_FORM_PROP_CONTRIBUTORS',
  );
export const OPENIDDICT_PRO_EDIT_FORM_PROP_CONTRIBUTORS =
  defineToken<OpenIddictProEditFormPropContributors>('OPENIDDICT_PRO_EDIT_FORM_PROP_CONTRIBUTORS');
