import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
} from '@lsw-abpvue/components';
import { getCurrentInjector, inject } from '@lsw-abpvue/core';
import type { TemplateDefinitionDto } from '@lsw-abpvue/text-template-management/proxy';
import * as defaults from '../defaults/extensions.js';
import { TextTemplateManagementComponents as Keys } from '../enums/components.js';
import {
  TEXT_TEMPLATE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS,
  TEXT_TEMPLATE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
  TEXT_TEMPLATE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

export function textTemplateManagementExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;
  const extensions = inject(ExtensionsService);
  const optional = { optional: true } as const;
  const key = Keys.TextTemplates;
  const actions = inject(TEXT_TEMPLATE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS, optional);
  const toolbar = inject(TEXT_TEMPLATE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS, optional);
  const props = inject(TEXT_TEMPLATE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS, optional);
  const entities = getObjectExtensionEntities(injector, 'TextTemplateManagement');
  const backend = mapEntitiesToContributors<TemplateDefinitionDto>(
    injector,
    { [key]: entities.TextDefinition },
    'TextTemplateManagement',
  );
  mergeWithDefaultActions(
    extensions.entityActions,
    defaults.DEFAULT_TEXT_TEMPLATE_MANAGEMENT_ENTITY_ACTIONS,
    { [key]: actions?.[key] ?? [] },
  );
  mergeWithDefaultActions(
    extensions.toolbarActions,
    defaults.DEFAULT_TEXT_TEMPLATE_MANAGEMENT_TOOLBAR_ACTIONS,
    { [key]: toolbar?.[key] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.entityProps,
    defaults.DEFAULT_TEXT_TEMPLATE_MANAGEMENT_ENTITY_PROPS,
    backend.prop,
    { [key]: props?.[key] ?? [] },
  );
}
