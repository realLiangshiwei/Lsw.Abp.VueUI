import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { defineToken } from '@lsw-abpvue/core';
import type { LanguageDto, LanguageTextDto } from '@lsw-abpvue/language-management/proxy';
import type { LanguageManagementComponents } from '../enums/components.js';

interface LanguageManagementRecords {
  [LanguageManagementComponents.Languages]: LanguageDto;
  [LanguageManagementComponents.LanguageTexts]: LanguageTextDto;
}

/** Contributions retain the DTO type belonging to each official component key. */
export type LanguageManagementEntityActionContributors = {
  [K in keyof LanguageManagementRecords]?:
    EntityActionContributorCallback<LanguageManagementRecords[K]>[] | undefined;
};
export type LanguageManagementEntityPropContributors = {
  [K in keyof LanguageManagementRecords]?:
    EntityPropContributorCallback<LanguageManagementRecords[K]>[] | undefined;
};
export type LanguageManagementToolbarActionContributors = {
  [K in keyof LanguageManagementRecords]?:
    ToolbarActionContributorCallback<readonly LanguageManagementRecords[K][]>[] | undefined;
};
export type LanguageManagementCreateFormPropContributors = {
  [K in keyof LanguageManagementRecords]?:
    FormPropContributorCallback<LanguageManagementRecords[K]>[] | undefined;
};
export type LanguageManagementEditFormPropContributors =
  LanguageManagementCreateFormPropContributors;

export interface LanguageManagementConfigOptions {
  entityActionContributors?: LanguageManagementEntityActionContributors | undefined;
  entityPropContributors?: LanguageManagementEntityPropContributors | undefined;
  toolbarActionContributors?: LanguageManagementToolbarActionContributors | undefined;
  createFormPropContributors?: LanguageManagementCreateFormPropContributors | undefined;
  editFormPropContributors?: LanguageManagementEditFormPropContributors | undefined;
}

export const LANGUAGE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS =
  defineToken<LanguageManagementEntityActionContributors>(
    'LANGUAGE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS',
  );
export const LANGUAGE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS =
  defineToken<LanguageManagementEntityPropContributors>(
    'LANGUAGE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS',
  );
export const LANGUAGE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS =
  defineToken<LanguageManagementToolbarActionContributors>(
    'LANGUAGE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS',
  );
export const LANGUAGE_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS =
  defineToken<LanguageManagementCreateFormPropContributors>(
    'LANGUAGE_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS',
  );
export const LANGUAGE_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS =
  defineToken<LanguageManagementEditFormPropContributors>(
    'LANGUAGE_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS',
  );
