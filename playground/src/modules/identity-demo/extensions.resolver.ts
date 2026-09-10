import {
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
  ExtensionsService,
} from '@lsw-abpvue/components';
import { getCurrentInjector } from '@lsw-abpvue/core';
import {
  DEFAULT_USERS_ENTITY_ACTIONS,
  DEFAULT_USERS_ENTITY_PROPS,
  DEFAULT_USERS_FORM_PROPS,
  DEFAULT_USERS_TOOLBAR_ACTIONS,
} from './defaults/users.js';
import { IdentityComponents } from './enums.js';
import type { DemoUserDto } from './services/users.service.js';
import {
  IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS,
  IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS,
  IDENTITY_ENTITY_ACTION_CONTRIBUTORS,
  IDENTITY_ENTITY_PROP_CONTRIBUTORS,
  IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS,
} from './tokens/extensions.token.js';

/**
 * Assembles the five extension points before the page is allowed to render, in the order
 * that decides priority: the module's defaults, then what the backend's object
 * extensions add, then what the application contributed (design 05 §6).
 *
 * Running it again is harmless -- a repeated navigation replaces the contributors rather
 * than adding a second copy of every column.
 */
export function identityExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;

  const extensions = injector.get(ExtensionsService);
  const optional = { optional: true } as const;

  const entities = getObjectExtensionEntities(injector, 'Identity');
  const fromBackend = mapEntitiesToContributors<DemoUserDto>(
    injector,
    { [IdentityComponents.Users]: entities.User },
    'AbpIdentity',
  );

  mergeWithDefaultProps(
    extensions.entityProps,
    { [IdentityComponents.Users]: DEFAULT_USERS_ENTITY_PROPS },
    fromBackend.prop,
    injector.get(IDENTITY_ENTITY_PROP_CONTRIBUTORS, {}, optional) ?? {},
  );

  mergeWithDefaultProps(
    extensions.createFormProps,
    { [IdentityComponents.Users]: DEFAULT_USERS_FORM_PROPS },
    fromBackend.createForm,
    injector.get(IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS, {}, optional) ?? {},
  );

  mergeWithDefaultProps(
    extensions.editFormProps,
    { [IdentityComponents.Users]: DEFAULT_USERS_FORM_PROPS },
    fromBackend.editForm,
    injector.get(IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS, {}, optional) ?? {},
  );

  mergeWithDefaultActions(
    extensions.entityActions,
    { [IdentityComponents.Users]: DEFAULT_USERS_ENTITY_ACTIONS },
    injector.get(IDENTITY_ENTITY_ACTION_CONTRIBUTORS, {}, optional) ?? {},
  );

  mergeWithDefaultActions(
    extensions.toolbarActions,
    { [IdentityComponents.Users]: DEFAULT_USERS_TOOLBAR_ACTIONS },
    injector.get(IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS, {}, optional) ?? {},
  );
}
