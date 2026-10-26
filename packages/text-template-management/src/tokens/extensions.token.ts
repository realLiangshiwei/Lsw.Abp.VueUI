import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { defineToken } from '@lsw-abpvue/core';
import type { TemplateDefinitionDto } from '@lsw-abpvue/text-template-management/proxy';
import type { TextTemplateManagementComponents } from '../enums/components.js';

/** Contributions to the official text template list component. */
export type TextTemplateManagementEntityActionContributors = {
  [TextTemplateManagementComponents.TextTemplates]?:
    EntityActionContributorCallback<TemplateDefinitionDto>[] | undefined;
};
export type TextTemplateManagementEntityPropContributors = {
  [TextTemplateManagementComponents.TextTemplates]?:
    EntityPropContributorCallback<TemplateDefinitionDto>[] | undefined;
};
export type TextTemplateManagementToolbarActionContributors = {
  [TextTemplateManagementComponents.TextTemplates]?:
    ToolbarActionContributorCallback<readonly TemplateDefinitionDto[]>[] | undefined;
};

export interface TextTemplateManagementConfigOptions {
  entityActionContributors?: TextTemplateManagementEntityActionContributors | undefined;
  entityPropContributors?: TextTemplateManagementEntityPropContributors | undefined;
  toolbarActionContributors?: TextTemplateManagementToolbarActionContributors | undefined;
}

export const TEXT_TEMPLATE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS =
  defineToken<TextTemplateManagementEntityActionContributors>(
    'TEXT_TEMPLATE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS',
  );
export const TEXT_TEMPLATE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS =
  defineToken<TextTemplateManagementEntityPropContributors>(
    'TEXT_TEMPLATE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS',
  );
export const TEXT_TEMPLATE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS =
  defineToken<TextTemplateManagementToolbarActionContributors>(
    'TEXT_TEMPLATE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS',
  );
