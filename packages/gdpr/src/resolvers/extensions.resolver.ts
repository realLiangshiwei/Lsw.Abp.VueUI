import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
} from '@lsw-abpvue/components';
import { getCurrentInjector, inject } from '@lsw-abpvue/core';
import type { GdprRequestDto } from '@lsw-abpvue/gdpr/proxy';
import {
  DEFAULT_GDPR_ENTITY_PROPS_VALUE,
  DEFAULT_GDPR_TOOLBAR_ACTIONS_VALUE,
} from '../defaults/extensions.js';
import { GdprComponents } from '../enums/components.js';
import {
  DEFAULT_GDPR_ENTITY_PROPS,
  DEFAULT_GDPR_TOOLBAR_ACTIONS,
} from '../tokens/extensions.token.js';

export function gdprExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;
  const extensions = inject(ExtensionsService);
  const entities = getObjectExtensionEntities(injector, 'Gdpr');
  const key = GdprComponents.PersonalData;
  const props = inject(DEFAULT_GDPR_ENTITY_PROPS, { optional: true }) ?? {};
  const toolbar = inject(DEFAULT_GDPR_TOOLBAR_ACTIONS, { optional: true }) ?? {};
  const backend = mapEntitiesToContributors<GdprRequestDto>(
    injector,
    { [GdprComponents.PersonalData]: entities.PersonalData },
    'AbpGdpr',
  );
  mergeWithDefaultProps(extensions.entityProps, DEFAULT_GDPR_ENTITY_PROPS_VALUE, backend.prop, {
    [key]: props[key] ?? [],
  });
  mergeWithDefaultActions(extensions.toolbarActions, DEFAULT_GDPR_TOOLBAR_ACTIONS_VALUE, {
    [key]: toolbar[key] ?? [],
  });
}
