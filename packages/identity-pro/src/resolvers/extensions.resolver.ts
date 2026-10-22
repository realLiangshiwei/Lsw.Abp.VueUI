import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
  type EntityAction,
  type EntityProp,
  type FormProp,
  type ToolbarAction,
  type EntityActionContributorCallback,
  type EntityPropContributorCallback,
  type FormPropContributorCallback,
  type ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { getCurrentInjector, type Injector, type EntityExtensionDto } from '@lsw-abpvue/core';
import { IdentityProComponents } from '../enums/components.js';
import {
  DEFAULT_ORGANIZATION_UNITS_CREATE_FORM_PROPS,
  DEFAULT_ORGANIZATION_UNITS_EDIT_FORM_PROPS,
  DEFAULT_ORGANIZATION_UNITS_TOOLBAR_ACTIONS,
  DEFAULT_ORGANIZATION_MEMBERS_ENTITY_PROPS,
  DEFAULT_ORGANIZATION_MEMBERS_ENTITY_ACTIONS,
  DEFAULT_ORGANIZATION_ROLES_ENTITY_PROPS,
  DEFAULT_ORGANIZATION_ROLES_ENTITY_ACTIONS,
} from '../defaults/organization-units.js';
import {
  DEFAULT_SECURITY_LOGS_ENTITY_PROPS,
  DEFAULT_SECURITY_LOGS_ENTITY_ACTIONS,
  DEFAULT_SECURITY_LOGS_TOOLBAR_ACTIONS,
} from '../defaults/security-logs.js';
import {
  DEFAULT_IDENTITY_PRO_USERS_CREATE_FORM_PROPS,
  DEFAULT_IDENTITY_PRO_USERS_EDIT_FORM_PROPS,
  DEFAULT_IDENTITY_PRO_USERS_ENTITY_ACTIONS,
  DEFAULT_IDENTITY_PRO_USERS_ENTITY_PROPS,
  DEFAULT_IDENTITY_PRO_USERS_TOOLBAR_ACTIONS,
} from '../defaults/users.js';
import {
  DEFAULT_IDENTITY_PRO_ROLES_ENTITY_PROPS,
  DEFAULT_IDENTITY_PRO_ROLES_CREATE_FORM_PROPS,
  DEFAULT_IDENTITY_PRO_ROLES_EDIT_FORM_PROPS,
  DEFAULT_IDENTITY_PRO_ROLES_ENTITY_ACTIONS,
  DEFAULT_IDENTITY_PRO_ROLES_TOOLBAR_ACTIONS,
} from '../defaults/roles.js';
import {
  DEFAULT_CLAIMS_ENTITY_PROPS,
  DEFAULT_CLAIMS_CREATE_FORM_PROPS,
  DEFAULT_CLAIMS_EDIT_FORM_PROPS,
  DEFAULT_CLAIMS_ENTITY_ACTIONS,
  DEFAULT_CLAIMS_TOOLBAR_ACTIONS,
} from '../defaults/claims.js';
import {
  IDENTITY_PRO_CREATE_FORM_PROP_CONTRIBUTORS,
  IDENTITY_PRO_EDIT_FORM_PROP_CONTRIBUTORS,
  IDENTITY_PRO_ENTITY_ACTION_CONTRIBUTORS,
  IDENTITY_PRO_ENTITY_PROP_CONTRIBUTORS,
  IDENTITY_PRO_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

interface PageDefaults<R> {
  props: readonly EntityProp<R>[];
  create: readonly FormProp<R>[];
  edit: readonly FormProp<R>[];
  actions: readonly EntityAction<R>[];
  toolbar: readonly ToolbarAction<readonly R[]>[];
}

interface PageContributors<R> {
  props?: EntityPropContributorCallback<R>[] | undefined;
  create?: FormPropContributorCallback<R>[] | undefined;
  edit?: FormPropContributorCallback<R>[] | undefined;
  actions?: EntityActionContributorCallback<R>[] | undefined;
  toolbar?: ToolbarActionContributorCallback<readonly R[]>[] | undefined;
}

/** Assembles commercial defaults, backend extensions and application contributions in that order. */
export function identityProExtensionsResolver(): void {
  const current = getCurrentInjector();
  if (!current) return;
  const injector: Injector = current;
  const extensions = injector.get(ExtensionsService);
  const optional = { optional: true } as const;
  const props = injector.get(IDENTITY_PRO_ENTITY_PROP_CONTRIBUTORS, undefined, optional);
  const create = injector.get(IDENTITY_PRO_CREATE_FORM_PROP_CONTRIBUTORS, undefined, optional);
  const edit = injector.get(IDENTITY_PRO_EDIT_FORM_PROP_CONTRIBUTORS, undefined, optional);
  const actions = injector.get(IDENTITY_PRO_ENTITY_ACTION_CONTRIBUTORS, undefined, optional);
  const toolbar = injector.get(IDENTITY_PRO_TOOLBAR_ACTION_CONTRIBUTORS, undefined, optional);
  const entities = getObjectExtensionEntities(injector, 'Identity');

  function assemble<R>(
    key: string,
    entity: EntityExtensionDto | undefined,
    defaults: PageDefaults<R>,
    contributions: PageContributors<R>,
  ): void {
    const backend = mapEntitiesToContributors<R>(injector, { [key]: entity }, 'AbpIdentity');
    mergeWithDefaultProps(extensions.entityProps, { [key]: defaults.props }, backend.prop, {
      [key]: contributions.props ?? [],
    });
    mergeWithDefaultProps(
      extensions.createFormProps,
      { [key]: defaults.create },
      backend.createForm,
      {
        [key]: contributions.create ?? [],
      },
    );
    mergeWithDefaultProps(extensions.editFormProps, { [key]: defaults.edit }, backend.editForm, {
      [key]: contributions.edit ?? [],
    });
    mergeWithDefaultActions(
      extensions.entityActions,
      { [key]: defaults.actions },
      {
        [key]: contributions.actions ?? [],
      },
    );
    mergeWithDefaultActions(
      extensions.toolbarActions,
      { [key]: defaults.toolbar },
      {
        [key]: contributions.toolbar ?? [],
      },
    );
  }

  assemble(
    IdentityProComponents.OrganizationUnits,
    entities.OrganizationUnit,
    {
      props: [],
      actions: [],
      create: DEFAULT_ORGANIZATION_UNITS_CREATE_FORM_PROPS,
      edit: DEFAULT_ORGANIZATION_UNITS_EDIT_FORM_PROPS,
      toolbar: DEFAULT_ORGANIZATION_UNITS_TOOLBAR_ACTIONS,
    },
    {
      create: create?.[IdentityProComponents.OrganizationUnits],
      edit: edit?.[IdentityProComponents.OrganizationUnits],
      toolbar: toolbar?.[IdentityProComponents.OrganizationUnits],
    },
  );
  assemble(
    IdentityProComponents.OrganizationMembers,
    undefined,
    {
      props: DEFAULT_ORGANIZATION_MEMBERS_ENTITY_PROPS,
      actions: DEFAULT_ORGANIZATION_MEMBERS_ENTITY_ACTIONS,
      create: [],
      edit: [],
      toolbar: [],
    },
    {
      props: props?.[IdentityProComponents.OrganizationMembers],
      actions: actions?.[IdentityProComponents.OrganizationMembers],
    },
  );
  assemble(
    IdentityProComponents.OrganizationRoles,
    undefined,
    {
      props: DEFAULT_ORGANIZATION_ROLES_ENTITY_PROPS,
      actions: DEFAULT_ORGANIZATION_ROLES_ENTITY_ACTIONS,
      create: [],
      edit: [],
      toolbar: [],
    },
    {
      props: props?.[IdentityProComponents.OrganizationRoles],
      actions: actions?.[IdentityProComponents.OrganizationRoles],
    },
  );
  assemble(
    IdentityProComponents.SecurityLogs,
    undefined,
    {
      props: DEFAULT_SECURITY_LOGS_ENTITY_PROPS,
      actions: DEFAULT_SECURITY_LOGS_ENTITY_ACTIONS,
      create: [],
      edit: [],
      toolbar: DEFAULT_SECURITY_LOGS_TOOLBAR_ACTIONS,
    },
    {
      props: props?.[IdentityProComponents.SecurityLogs],
      actions: actions?.[IdentityProComponents.SecurityLogs],
      toolbar: toolbar?.[IdentityProComponents.SecurityLogs],
    },
  );

  assemble(
    IdentityProComponents.Users,
    entities.User,
    {
      props: DEFAULT_IDENTITY_PRO_USERS_ENTITY_PROPS,
      create: DEFAULT_IDENTITY_PRO_USERS_CREATE_FORM_PROPS,
      edit: DEFAULT_IDENTITY_PRO_USERS_EDIT_FORM_PROPS,
      actions: DEFAULT_IDENTITY_PRO_USERS_ENTITY_ACTIONS,
      toolbar: DEFAULT_IDENTITY_PRO_USERS_TOOLBAR_ACTIONS,
    },
    {
      props: props?.[IdentityProComponents.Users],
      create: create?.[IdentityProComponents.Users],
      edit: edit?.[IdentityProComponents.Users],
      actions: actions?.[IdentityProComponents.Users],
      toolbar: toolbar?.[IdentityProComponents.Users],
    },
  );

  assemble(
    IdentityProComponents.Roles,
    entities.Role,
    {
      props: DEFAULT_IDENTITY_PRO_ROLES_ENTITY_PROPS,
      create: DEFAULT_IDENTITY_PRO_ROLES_CREATE_FORM_PROPS,
      edit: DEFAULT_IDENTITY_PRO_ROLES_EDIT_FORM_PROPS,
      actions: DEFAULT_IDENTITY_PRO_ROLES_ENTITY_ACTIONS,
      toolbar: DEFAULT_IDENTITY_PRO_ROLES_TOOLBAR_ACTIONS,
    },
    {
      props: props?.[IdentityProComponents.Roles],
      create: create?.[IdentityProComponents.Roles],
      edit: edit?.[IdentityProComponents.Roles],
      actions: actions?.[IdentityProComponents.Roles],
      toolbar: toolbar?.[IdentityProComponents.Roles],
    },
  );

  assemble(
    IdentityProComponents.Claims,
    entities.ClaimType,
    {
      props: DEFAULT_CLAIMS_ENTITY_PROPS,
      create: DEFAULT_CLAIMS_CREATE_FORM_PROPS,
      edit: DEFAULT_CLAIMS_EDIT_FORM_PROPS,
      actions: DEFAULT_CLAIMS_ENTITY_ACTIONS,
      toolbar: DEFAULT_CLAIMS_TOOLBAR_ACTIONS,
    },
    {
      props: props?.[IdentityProComponents.Claims],
      create: create?.[IdentityProComponents.Claims],
      edit: edit?.[IdentityProComponents.Claims],
      actions: actions?.[IdentityProComponents.Claims],
      toolbar: toolbar?.[IdentityProComponents.Claims],
    },
  );
}
