import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
} from '@lsw-abpvue/components';
import { inject, getCurrentInjector } from '@lsw-abpvue/core';
import type { ApplicationDto, ScopeDto } from '@lsw-abpvue/openiddict-pro/proxy';
import * as defaults from '../defaults/extensions.js';
import { OpenIddictProComponents as Keys } from '../enums/components.js';
import {
  OPENIDDICT_PRO_CREATE_FORM_PROP_CONTRIBUTORS,
  OPENIDDICT_PRO_EDIT_FORM_PROP_CONTRIBUTORS,
  OPENIDDICT_PRO_ENTITY_ACTION_CONTRIBUTORS,
  OPENIDDICT_PRO_ENTITY_PROP_CONTRIBUTORS,
  OPENIDDICT_PRO_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

/** Assembles defaults, object extensions and application contributions, in that order. */
export function openIddictProExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;
  const extensions = inject(ExtensionsService);
  const optional = { optional: true } as const;
  const actions = inject(OPENIDDICT_PRO_ENTITY_ACTION_CONTRIBUTORS, optional) ?? {};
  const props = inject(OPENIDDICT_PRO_ENTITY_PROP_CONTRIBUTORS, optional) ?? {};
  const toolbar = inject(OPENIDDICT_PRO_TOOLBAR_ACTION_CONTRIBUTORS, optional) ?? {};
  const create = inject(OPENIDDICT_PRO_CREATE_FORM_PROP_CONTRIBUTORS, optional) ?? {};
  const edit = inject(OPENIDDICT_PRO_EDIT_FORM_PROP_CONTRIBUTORS, optional) ?? {};
  const entities = getObjectExtensionEntities(injector, 'OpenIddictPro');
  const apps = mapEntitiesToContributors<ApplicationDto>(
    injector,
    { [Keys.Applications]: entities.ApiResource },
    'AbpOpenIddictPro',
  );
  mergeWithDefaultActions(
    extensions.entityActions,
    { [Keys.Applications]: defaults.DEFAULT_APPLICATIONS_ENTITY_ACTIONS },
    { [Keys.Applications]: actions[Keys.Applications] ?? [] },
  );
  mergeWithDefaultActions(
    extensions.toolbarActions,
    { [Keys.Applications]: defaults.DEFAULT_APPLICATIONS_TOOLBAR_ACTIONS },
    { [Keys.Applications]: toolbar[Keys.Applications] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.entityProps,
    { [Keys.Applications]: defaults.DEFAULT_APPLICATIONS_ENTITY_PROPS },
    apps.prop,
    { [Keys.Applications]: props[Keys.Applications] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.createFormProps,
    { [Keys.Applications]: defaults.DEFAULT_APPLICATIONS_CREATE_FORM_PROPS },
    apps.createForm,
    { [Keys.Applications]: create[Keys.Applications] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.editFormProps,
    { [Keys.Applications]: defaults.DEFAULT_APPLICATIONS_FORM_PROPS },
    apps.editForm,
    { [Keys.Applications]: edit[Keys.Applications] ?? [] },
  );
  const scopes = mapEntitiesToContributors<ScopeDto>(
    injector,
    { [Keys.Scopes]: entities.Scopes },
    'AbpOpenIddictPro',
  );
  mergeWithDefaultActions(
    extensions.entityActions,
    { [Keys.Scopes]: defaults.DEFAULT_SCOPE_ENTITY_ACTIONS },
    { [Keys.Scopes]: actions[Keys.Scopes] ?? [] },
  );
  mergeWithDefaultActions(
    extensions.toolbarActions,
    { [Keys.Scopes]: defaults.DEFAULT_SCOPES_TOOLBAR_ACTIONS },
    { [Keys.Scopes]: toolbar[Keys.Scopes] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.entityProps,
    { [Keys.Scopes]: defaults.DEFAULT_SCOPES_ENTITY_PROPS },
    scopes.prop,
    { [Keys.Scopes]: props[Keys.Scopes] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.createFormProps,
    { [Keys.Scopes]: defaults.DEFAULT_SCOPE_CREATE_FORM_PROPS },
    scopes.createForm,
    { [Keys.Scopes]: create[Keys.Scopes] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.editFormProps,
    { [Keys.Scopes]: defaults.DEFAULT_SCOPES_FORM_PROPS },
    scopes.editForm,
    { [Keys.Scopes]: edit[Keys.Scopes] ?? [] },
  );
}
