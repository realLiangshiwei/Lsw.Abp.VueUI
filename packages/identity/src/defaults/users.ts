import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
  type FormPropOptions,
} from '@lsw-abpvue/components';
import { ConfigStateService } from '@lsw-abpvue/core';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import { IdentityPolicyNames } from '@lsw-abpvue/identity/config';
import { getPasswordValidators, Validators } from '@lsw-abpvue/theme-shared';
import UserNameCell from '../components/UserNameCell.vue';
import { USERS_PAGE } from '../tokens/extensions.token.js';

/**
 * What the module itself puts on the users page. A host never edits this file: it
 * registers contributors through `provideIdentity()`, and they run after these.
 */
export const DEFAULT_USERS_ENTITY_PROPS = EntityProp.createMany<IdentityUserDto>([
  {
    type: PropType.String,
    name: 'userName',
    displayName: 'AbpIdentity::UserName',
    sortable: true,
    columnWidth: 250,
    // ABP marks a deactivated account with an icon. Angular builds that as an HTML
    // string and renders it with `innerHTML`; here it is a component (difference 2).
    component: UserNameCell,
  },
  {
    type: PropType.String,
    name: 'email',
    displayName: 'AbpIdentity::EmailAddress',
    sortable: true,
    columnWidth: 250,
  },
  {
    type: PropType.String,
    name: 'phoneNumber',
    displayName: 'AbpIdentity::PhoneNumber',
    sortable: true,
    columnWidth: 250,
  },
]);

const USER_FIELDS: FormPropOptions<IdentityUserDto>[] = [
  {
    type: PropType.String,
    name: 'userName',
    displayName: 'AbpIdentity::UserName',
    id: 'user-name',
    validators: () => [Validators.required(), Validators.maxLength(256)],
  },
  {
    type: PropType.PasswordInputGroup,
    name: 'password',
    displayName: 'AbpIdentity::Password',
    id: 'password',
    autocomplete: 'new-password',
    validators: data => [Validators.required(), ...getPasswordValidators(data.getInjected)],
  },
  {
    type: PropType.String,
    name: 'name',
    displayName: 'AbpIdentity::DisplayName:Name',
    id: 'name',
    validators: () => [Validators.maxLength(64)],
  },
  {
    type: PropType.String,
    name: 'surname',
    displayName: 'AbpIdentity::DisplayName:Surname',
    id: 'surname',
    validators: () => [Validators.maxLength(64)],
  },
  {
    type: PropType.Email,
    name: 'email',
    displayName: 'AbpIdentity::EmailAddress',
    id: 'email',
    validators: () => [Validators.required(), Validators.maxLength(256), Validators.email()],
  },
  {
    type: PropType.String,
    name: 'phoneNumber',
    displayName: 'AbpIdentity::PhoneNumber',
    id: 'phone-number',
    validators: () => [Validators.maxLength(16)],
  },
  {
    type: PropType.Boolean,
    name: 'isActive',
    displayName: 'AbpIdentity::DisplayName:IsActive',
    id: 'active-checkbox',
    defaultValue: true,
  },
  {
    type: PropType.Boolean,
    name: 'lockoutEnabled',
    displayName: 'AbpIdentity::DisplayName:LockoutEnabled',
    id: 'lockout-checkbox',
    defaultValue: true,
  },
];

export const DEFAULT_USERS_CREATE_FORM_PROPS = FormProp.createMany<IdentityUserDto>(USER_FIELDS);

export const DEFAULT_USERS_EDIT_FORM_PROPS = FormProp.createMany<IdentityUserDto>(
  USER_FIELDS.map(field => {
    // An existing account keeps its password unless one is typed, and nobody may
    // deactivate the account they are signed in as.
    if (field.name === 'password') {
      return { ...field, validators: data => getPasswordValidators(data.getInjected) };
    }

    if (field.name === 'isActive') {
      return {
        ...field,
        visible: data => {
          const configState = data?.getInjected(ConfigStateService);
          return configState?.getOne('currentUser').value.id !== data?.record.id;
        },
      };
    }

    return field;
  }),
);

export const DEFAULT_USERS_ENTITY_ACTIONS = EntityAction.createMany<IdentityUserDto>([
  {
    text: 'AbpUi::Edit',
    icon: 'bi bi-pencil',
    permission: IdentityPolicyNames.UsersUpdate,
    action: data => data.getInjected(USERS_PAGE).edit(data.record),
  },
  {
    text: 'AbpIdentity::Permissions',
    icon: 'bi bi-key',
    permission: IdentityPolicyNames.UsersManagePermissions,
    action: data => data.getInjected(USERS_PAGE).managePermissions(data.record),
  },
  {
    text: 'AbpUi::Delete',
    icon: 'bi bi-trash',
    permission: IdentityPolicyNames.UsersDelete,
    action: data => data.getInjected(USERS_PAGE).remove(data.record),
    // ABP hides it on the account you are signed in as.
    visible: data => {
      const configState = data?.getInjected(ConfigStateService);
      return configState?.getOne('currentUser').value.userName !== data?.record.userName;
    },
  },
]);

export const DEFAULT_USERS_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly IdentityUserDto[]>([
  {
    text: 'AbpIdentity::NewUser',
    icon: 'bi bi-plus',
    permission: IdentityPolicyNames.UsersCreate,
    action: data => data.getInjected(USERS_PAGE).add(),
  },
]);
