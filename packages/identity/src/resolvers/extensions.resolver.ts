import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
  type EntityAction,
  type EntityPropContributorCallback,
  type EntityProp,
  type EntityActionContributorCallback,
  type FormProp,
  type FormPropContributorCallback,
  type ObjectExtensionContributors,
  type ToolbarAction,
  type ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { getCurrentInjector } from '@lsw-abpvue/core';
import type { IdentityRoleDto, IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import {
  DEFAULT_ROLES_CREATE_FORM_PROPS,
  DEFAULT_ROLES_EDIT_FORM_PROPS,
  DEFAULT_ROLES_ENTITY_ACTIONS,
  DEFAULT_ROLES_ENTITY_PROPS,
  DEFAULT_ROLES_TOOLBAR_ACTIONS,
} from '../defaults/roles.js';
import {
  DEFAULT_USERS_CREATE_FORM_PROPS,
  DEFAULT_USERS_EDIT_FORM_PROPS,
  DEFAULT_USERS_ENTITY_ACTIONS,
  DEFAULT_USERS_ENTITY_PROPS,
  DEFAULT_USERS_TOOLBAR_ACTIONS,
} from '../defaults/users.js';
import { IdentityComponents } from '../enums/components.js';
import {
  IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS,
  IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS,
  IDENTITY_ENTITY_ACTION_CONTRIBUTORS,
  IDENTITY_ENTITY_PROP_CONTRIBUTORS,
  IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';
import type {
  IdentityEntityActionContributors,
  IdentityEntityPropContributors,
  IdentityFormPropContributors,
  IdentityToolbarActionContributors,
} from '../tokens/extensions.token.js';

/** The module's own props and actions for one page. */
interface PageDefaults<R> {
  entityProps: EntityProp<R>[];
  createFormProps: FormProp<R>[];
  editFormProps: FormProp<R>[];
  entityActions: EntityAction<R>[];
  toolbarActions: ToolbarAction<readonly R[]>[];
}

/** What the host contributed for that page, already narrowed to its component key. */
interface PageContributors<R> {
  entityProps: EntityPropContributorCallback<R>[];
  createFormProps: FormPropContributorCallback<R>[];
  editFormProps: FormPropContributorCallback<R>[];
  entityActions: EntityActionContributorCallback<R>[];
  toolbarActions: ToolbarActionContributorCallback<readonly R[]>[];
}

/**
 * One page's five extension points. Assembled per page rather than for both at once, so
 * a users contributor is typed against the user DTO and a roles contributor against the
 * role DTO -- Angular takes the other way out and types the whole record as `any`.
 */
function assemble<R>(
  extensions: ExtensionsService,
  key: string,
  defaults: PageDefaults<R>,
  fromBackend: ObjectExtensionContributors<R>,
  contributed: PageContributors<R>,
): void {
  mergeWithDefaultProps(extensions.entityProps, { [key]: defaults.entityProps }, fromBackend.prop, {
    [key]: contributed.entityProps,
  });

  mergeWithDefaultProps(
    extensions.createFormProps,
    { [key]: defaults.createFormProps },
    fromBackend.createForm,
    { [key]: contributed.createFormProps },
  );

  mergeWithDefaultProps(
    extensions.editFormProps,
    { [key]: defaults.editFormProps },
    fromBackend.editForm,
    { [key]: contributed.editFormProps },
  );

  mergeWithDefaultActions(
    extensions.entityActions,
    { [key]: defaults.entityActions },
    { [key]: contributed.entityActions },
  );

  mergeWithDefaultActions(
    extensions.toolbarActions,
    { [key]: defaults.toolbarActions },
    { [key]: contributed.toolbarActions },
  );
}

/**
 * Assembles the five extension points before either page is allowed to render, in the
 * order that decides priority: the module's defaults, then what the backend's object
 * extensions add, then what the application contributed (design 05 §6).
 *
 * Running it again is harmless: a repeated navigation replaces the contributors rather
 * than adding a second copy of every column.
 */
export function identityExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;

  const extensions = injector.get(ExtensionsService);
  const optional = { optional: true } as const;
  const entities = getObjectExtensionEntities(injector, 'Identity');

  const entityProps: IdentityEntityPropContributors =
    injector.get(IDENTITY_ENTITY_PROP_CONTRIBUTORS, {}, optional) ?? {};
  const createFormProps: IdentityFormPropContributors =
    injector.get(IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS, {}, optional) ?? {};
  const editFormProps: IdentityFormPropContributors =
    injector.get(IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS, {}, optional) ?? {};
  const entityActions: IdentityEntityActionContributors =
    injector.get(IDENTITY_ENTITY_ACTION_CONTRIBUTORS, {}, optional) ?? {};
  const toolbarActions: IdentityToolbarActionContributors =
    injector.get(IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS, {}, optional) ?? {};

  assemble<IdentityUserDto>(
    extensions,
    IdentityComponents.Users,
    {
      entityProps: DEFAULT_USERS_ENTITY_PROPS,
      createFormProps: DEFAULT_USERS_CREATE_FORM_PROPS,
      editFormProps: DEFAULT_USERS_EDIT_FORM_PROPS,
      entityActions: DEFAULT_USERS_ENTITY_ACTIONS,
      toolbarActions: DEFAULT_USERS_TOOLBAR_ACTIONS,
    },
    mapEntitiesToContributors<IdentityUserDto>(
      injector,
      { [IdentityComponents.Users]: entities.User },
      'AbpIdentity',
    ),
    {
      entityProps: entityProps[IdentityComponents.Users] ?? [],
      createFormProps: createFormProps[IdentityComponents.Users] ?? [],
      editFormProps: editFormProps[IdentityComponents.Users] ?? [],
      entityActions: entityActions[IdentityComponents.Users] ?? [],
      toolbarActions: toolbarActions[IdentityComponents.Users] ?? [],
    },
  );

  assemble<IdentityRoleDto>(
    extensions,
    IdentityComponents.Roles,
    {
      entityProps: DEFAULT_ROLES_ENTITY_PROPS,
      createFormProps: DEFAULT_ROLES_CREATE_FORM_PROPS,
      editFormProps: DEFAULT_ROLES_EDIT_FORM_PROPS,
      entityActions: DEFAULT_ROLES_ENTITY_ACTIONS,
      toolbarActions: DEFAULT_ROLES_TOOLBAR_ACTIONS,
    },
    mapEntitiesToContributors<IdentityRoleDto>(
      injector,
      { [IdentityComponents.Roles]: entities.Role },
      'AbpIdentity',
    ),
    {
      entityProps: entityProps[IdentityComponents.Roles] ?? [],
      createFormProps: createFormProps[IdentityComponents.Roles] ?? [],
      editFormProps: editFormProps[IdentityComponents.Roles] ?? [],
      entityActions: entityActions[IdentityComponents.Roles] ?? [],
      toolbarActions: toolbarActions[IdentityComponents.Roles] ?? [],
    },
  );
}
