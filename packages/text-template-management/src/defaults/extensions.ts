import { EntityAction, EntityProp, PropType, ToolbarAction } from '@lsw-abpvue/components';
import { TextTemplateManagementPolicyNames as Policy } from '@lsw-abpvue/text-template-management/config';
import type { TemplateDefinitionDto } from '@lsw-abpvue/text-template-management/proxy';
import { TextTemplateManagementComponents as Keys } from '../enums/components.js';
import { TEXT_TEMPLATES_PAGE } from '../tokens/pages.token.js';

export const DEFAULT_TEXT_TEMPLATES_ENTITY_PROPS = EntityProp.createMany<TemplateDefinitionDto>([
  { name: 'displayName', displayName: 'TextTemplateManagement::Name', type: PropType.String },
  {
    name: 'isInlineLocalized',
    displayName: 'TextTemplateManagement::IsInlineLocalized',
    type: PropType.Boolean,
    columnWidth: 150,
  },
  {
    name: 'isLayout',
    displayName: 'TextTemplateManagement::IsLayout',
    type: PropType.Boolean,
    columnWidth: 150,
  },
  { name: 'layout', displayName: 'TextTemplateManagement::Layout', type: PropType.String },
  {
    name: 'defaultCultureName',
    displayName: 'TextTemplateManagement::DefaultCultureName',
    type: PropType.String,
  },
]);
export const DEFAULT_TEXT_TEMPLATES_ENTITY_ACTIONS = EntityAction.createMany<TemplateDefinitionDto>(
  [
    {
      text: 'TextTemplateManagement::EditContents',
      permission: Policy.EditContents,
      action: data => data.getInjected(TEXT_TEMPLATES_PAGE).editContents(data.record),
    },
  ],
);
export const DEFAULT_TEXT_TEMPLATES_TOOLBAR_ACTIONS = ToolbarAction.createMany<
  readonly TemplateDefinitionDto[]
>([]);

export const DEFAULT_TEXT_TEMPLATE_MANAGEMENT_ENTITY_ACTIONS = {
  [Keys.TextTemplates]: DEFAULT_TEXT_TEMPLATES_ENTITY_ACTIONS,
};
export const DEFAULT_TEXT_TEMPLATE_MANAGEMENT_ENTITY_PROPS = {
  [Keys.TextTemplates]: DEFAULT_TEXT_TEMPLATES_ENTITY_PROPS,
};
export const DEFAULT_TEXT_TEMPLATE_MANAGEMENT_TOOLBAR_ACTIONS = {
  [Keys.TextTemplates]: DEFAULT_TEXT_TEMPLATES_TOOLBAR_ACTIONS,
};
