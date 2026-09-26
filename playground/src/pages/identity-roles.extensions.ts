// What this page contributes to the extension system: its columns, its form fields and
// its buttons. This is the file to edit -- a column removed here is a column gone, and a
// third-party package can add its own through the same extension points.
//
// `abpv generate --force` rewrites what is inside the `abpv:begin` markers and leaves
// everything else alone.

// abpv:begin imports
import {
  EntityAction,
  EntityProp,
  FormProp,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
  PropType,
  ToolbarAction,
  useExtensions,
} from '@lsw-abpvue/components';
import { defineToken, getCurrentInjector } from '@lsw-abpvue/core';
import { Validators } from '@lsw-abpvue/theme-shared';
import type { IdentityRoleDto } from '../proxy/volo/abp/identity';
// abpv:end imports

/** The page's key in the extension system: a contributor addresses the page by it. */
export const IDENTITY_ROLES = 'BookStore.IdentityRolesComponent';

/** What the page's own buttons call; the page provides it. */
export const IDENTITY_ROLES_PAGE = defineToken<{
  add(): void;
  edit(record: IdentityRoleDto): void;
  remove(record: IdentityRoleDto): void;
}>('IdentityRolesPage');

// abpv:begin props
export const IDENTITY_ROLE_ENTITY_PROPS = EntityProp.createMany<IdentityRoleDto>([
  {
    type: PropType.String,
    name: 'name',
    displayName: 'BookStore::Name',
    sortable: true,
  },
  {
    type: PropType.Boolean,
    name: 'isDefault',
    displayName: 'BookStore::IsDefault',
    sortable: true,
  },
  {
    type: PropType.Boolean,
    name: 'isStatic',
    displayName: 'BookStore::IsStatic',
    sortable: true,
  },
  {
    type: PropType.Boolean,
    name: 'isPublic',
    displayName: 'BookStore::IsPublic',
    sortable: true,
  },
]);

export const IDENTITY_ROLE_FORM_PROPS = FormProp.createMany<IdentityRoleDto>([
  {
    type: PropType.String,
    name: 'name',
    displayName: 'BookStore::Name',
    validators: () => [Validators.required(), Validators.maxLength(256)],
  },
  {
    type: PropType.Boolean,
    name: 'isDefault',
    displayName: 'BookStore::IsDefault',
  },
  {
    type: PropType.Boolean,
    name: 'isPublic',
    displayName: 'BookStore::IsPublic',
  },
]);
// abpv:end props

// abpv:begin actions
export const IDENTITY_ROLE_ENTITY_ACTIONS = EntityAction.createMany<IdentityRoleDto>([
  {
    text: 'AbpUi::Edit',
    icon: 'bi bi-pencil',
    action: data => data.getInjected(IDENTITY_ROLES_PAGE).edit(data.record),
  },
  {
    text: 'AbpUi::Delete',
    icon: 'bi bi-trash',
    action: data => data.getInjected(IDENTITY_ROLES_PAGE).remove(data.record),
  },
]);

export const IDENTITY_ROLE_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly IdentityRoleDto[]>([
  {
    text: 'BookStore::NewIdentityRole',
    icon: 'bi bi-plus',
    action: data => data.getInjected(IDENTITY_ROLES_PAGE).add(),
  },
]);
// abpv:end actions

// abpv:begin register
/** Puts all of it on the page. The page calls it once, from its `setup`. */
export function registerIdentityRolesExtensions(): void {
  const injector = getCurrentInjector();
  if (!injector) return;

  const extensions = useExtensions();

  // Whatever the backend declares in `ObjectExtensions` for this entity becomes a
  // column and a form field here, with no regeneration: it arrives in the
  // application configuration at runtime.
  const entities = getObjectExtensionEntities(injector, 'Identity');
  const fromBackend = mapEntitiesToContributors<IdentityRoleDto>(
    injector,
    { [IDENTITY_ROLES]: entities.Role },
    'BookStore',
  );

  mergeWithDefaultProps(
    extensions.entityProps,
    { [IDENTITY_ROLES]: IDENTITY_ROLE_ENTITY_PROPS },
    fromBackend.prop,
  );
  mergeWithDefaultProps(
    extensions.createFormProps,
    { [IDENTITY_ROLES]: IDENTITY_ROLE_FORM_PROPS },
    fromBackend.createForm,
  );
  mergeWithDefaultProps(
    extensions.editFormProps,
    { [IDENTITY_ROLES]: IDENTITY_ROLE_FORM_PROPS },
    fromBackend.editForm,
  );
  mergeWithDefaultActions(extensions.entityActions, {
    [IDENTITY_ROLES]: IDENTITY_ROLE_ENTITY_ACTIONS,
  });
  mergeWithDefaultActions(extensions.toolbarActions, {
    [IDENTITY_ROLES]: IDENTITY_ROLE_TOOLBAR_ACTIONS,
  });
}
// abpv:end register
