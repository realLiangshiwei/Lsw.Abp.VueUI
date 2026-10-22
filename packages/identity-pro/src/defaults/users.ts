import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
  type EntityActionContributorCallback,
  type FormPropOptions,
  type ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { ConfigStateService, EnvironmentService } from '@lsw-abpvue/core';
import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import { IdentityProPolicyNames } from '@lsw-abpvue/identity-pro/config';
import type { IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';
import { getPasswordValidators, Validators } from '@lsw-abpvue/theme-shared';
import UserIdentityCell from '../components/UserIdentityCell.vue';
import {
  IDENTITY_PRO_USER_FORM_VALUES,
  IDENTITY_PRO_USERS_PAGE,
} from '../tokens/users-page.token.js';
import {
  canDeleteUser,
  canInviteUsers,
  canRemoveUserFromTenant,
  canImpersonateUser,
  canLockUser,
  canManageHostLevelUserOperations,
  canManageUserTwoFactor,
  canUnlockUser,
} from '../utils/user-operation-policy.js';

export const DEFAULT_IDENTITY_PRO_USERS_ENTITY_PROPS = EntityProp.createMany<IdentityUserDto>([
  {
    type: PropType.String,
    name: 'userName',
    displayName: 'AbpIdentity::UserName',
    sortable: true,
    columnWidth: 250,
    component: UserIdentityCell,
  },
  {
    type: PropType.String,
    name: 'email',
    displayName: 'AbpIdentity::EmailAddress',
    sortable: true,
    columnWidth: 300,
    component: UserIdentityCell,
  },
  {
    type: PropType.String,
    name: 'roleNames',
    displayName: 'AbpIdentity::Roles',
    columnWidth: 250,
    valueResolver: data => data.record.roleNames?.join(', ') ?? '',
  },
  {
    type: PropType.String,
    name: 'phoneNumber',
    displayName: 'AbpIdentity::PhoneNumber',
    sortable: true,
    columnWidth: 250,
    component: UserIdentityCell,
  },
  {
    type: PropType.String,
    name: 'name',
    displayName: 'AbpIdentity::Name',
    sortable: true,
    columnWidth: 250,
  },
  {
    type: PropType.String,
    name: 'surname',
    displayName: 'AbpIdentity::Surname',
    sortable: true,
    columnWidth: 250,
  },
  {
    type: PropType.Boolean,
    name: 'isActive',
    displayName: 'AbpIdentity::DisplayName:IsActive',
    sortable: true,
    columnWidth: 100,
  },
  {
    type: PropType.Boolean,
    name: 'lockoutEnabled',
    displayName: 'AbpIdentity::DisplayName:LockoutEnabled',
    columnWidth: 100,
  },
  {
    type: PropType.Boolean,
    name: 'emailConfirmed',
    displayName: 'AbpIdentity::DisplayName:EmailConfirmed',
    sortable: true,
    columnWidth: 100,
  },
  {
    type: PropType.Boolean,
    name: 'twoFactorEnabled',
    displayName: 'AbpIdentity::DisplayName:TwoFactorEnabled',
    sortable: true,
    columnWidth: 100,
  },
  {
    type: PropType.Number,
    name: 'accessFailedCount',
    displayName: 'AbpIdentity::DisplayName:AccessFailedCount',
    sortable: true,
    columnWidth: 100,
  },
  {
    type: PropType.DateTime,
    name: 'creationTime',
    displayName: 'AbpIdentity::CreationTime',
    sortable: true,
    columnWidth: 200,
  },
  {
    type: PropType.DateTime,
    name: 'lastModificationTime',
    displayName: 'AbpIdentity::LastModificationTime',
    sortable: true,
    columnWidth: 200,
  },
]);

const fields: FormPropOptions<IdentityUserDto>[] = [
  {
    type: PropType.String,
    name: 'userName',
    displayName: 'AbpIdentity::UserName',
    id: 'user-name',
    validators: () => [Validators.required(), Validators.maxLength(256)],
  },
  {
    type: PropType.String,
    name: 'name',
    displayName: 'AbpIdentity::DisplayName:Name',
    id: 'name',
    group: { name: 'left', className: 'col col-md-6' },
    validators: () => [Validators.maxLength(64)],
  },
  {
    type: PropType.String,
    name: 'surname',
    displayName: 'AbpIdentity::DisplayName:Surname',
    id: 'surname',
    group: { name: 'right', className: 'col col-md-6' },
    validators: () => [Validators.maxLength(64)],
  },
  {
    type: PropType.PasswordInputGroup,
    name: 'password',
    displayName: 'AbpIdentity::Password',
    id: 'password',
    autocomplete: 'new-password',
    validators: data => [
      Validators.required(),
      Validators.maxLength(128),
      ...getPasswordValidators(data.getInjected),
    ],
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
    disabled: data =>
      !data ||
      !canManageHostLevelUserOperations(data.getInjected(ConfigStateService).snapshot()) ||
      Boolean(
        data.record.id &&
        data.record.id === data.getInjected(ConfigStateService).snapshot().currentUser.id,
      ),
  },
  {
    type: PropType.Boolean,
    name: 'lockoutEnabled',
    displayName: 'AbpIdentity::DisplayName:LockoutEnabled',
    id: 'lockout-checkbox',
    defaultValue: true,
    tooltip: { text: 'AbpIdentity::Description:LockoutEnabled' },
    disabled: data =>
      !data || !canManageHostLevelUserOperations(data.getInjected(ConfigStateService).snapshot()),
  },
  {
    type: PropType.Boolean,
    name: 'emailConfirmed',
    displayName: 'AbpIdentity::DisplayName:EmailConfirmed',
    id: 'emailConfirmed-checkbox',
    defaultValue: false,
  },
  {
    type: PropType.Boolean,
    name: 'phoneNumberConfirmed',
    displayName: 'AbpIdentity::DisplayName:PhoneNumberConfirmed',
    id: 'phoneNumberConfirmed',
    defaultValue: false,
    disabled: data => {
      if (!data) return true;
      const values = data.getInjected(IDENTITY_PRO_USER_FORM_VALUES, undefined, { optional: true });
      const phone = values ? values().phoneNumber : data.record.phoneNumber;
      return typeof phone !== 'string' || !phone.trim();
    },
  },
  {
    type: PropType.Boolean,
    name: 'shouldChangePasswordOnNextLogin',
    displayName: 'AbpIdentity::DisplayName:ShouldChangePasswordOnNextLogin',
    id: 'shouldChangePasswordOnNextLogin',
    defaultValue: false,
    tooltip: { text: 'AbpIdentity::Description:ShouldChangePasswordOnNextLogin' },
    disabled: data =>
      !data || !canManageHostLevelUserOperations(data.getInjected(ConfigStateService).snapshot()),
  },
];

export const DEFAULT_IDENTITY_PRO_USERS_CREATE_FORM_PROPS = FormProp.createMany(fields);
export const DEFAULT_IDENTITY_PRO_USERS_EDIT_FORM_PROPS = FormProp.createMany(
  fields.filter(field => field.name !== 'password'),
);

export const DEFAULT_IDENTITY_PRO_USERS_ENTITY_ACTIONS = EntityAction.createMany<IdentityUserDto>([
  {
    text: 'AbpIdentity::ViewDetails',
    icon: 'bi bi-eye',
    permission: IdentityProPolicyNames.UsersViewDetails,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).viewDetails(data.record),
  },
  {
    text: 'AbpUi::Edit',
    icon: 'bi bi-pencil',
    permission: IdentityProPolicyNames.UsersUpdate,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).edit(data.record),
  },
  {
    text: 'AbpIdentity::Claims',
    icon: 'bi bi-list-check',
    permission: IdentityProPolicyNames.UsersUpdate,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).manageClaims(data.record),
  },
  {
    text: 'AbpIdentity::Lock',
    icon: 'bi bi-lock',
    permission: IdentityProPolicyNames.UsersUpdate,
    visible: data =>
      Boolean(data && canLockUser(data.record, data.getInjected(ConfigStateService).snapshot())),
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).lock(data.record),
  },
  {
    text: 'AbpIdentity::Unlock',
    icon: 'bi bi-unlock',
    permission: IdentityProPolicyNames.UsersUpdate,
    visible: data =>
      Boolean(data && canUnlockUser(data.record, data.getInjected(ConfigStateService).snapshot())),
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).unlock(data.record),
  },
  {
    text: 'AbpIdentity::Permissions',
    icon: 'bi bi-key',
    permission: IdentityProPolicyNames.UsersManagePermissions,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).managePermissions(data.record),
  },
  {
    text: 'AbpIdentity::SetPassword',
    icon: 'bi bi-key',
    permission: IdentityProPolicyNames.UsersUpdate,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).setPassword(data.record),
  },
  {
    text: 'AbpIdentity::ChangeHistory',
    icon: 'bi bi-clock-history',
    permission: IdentityProPolicyNames.UsersChangeHistory,
    visible: data => Boolean(data?.getInjected(SHOW_ENTITY_HISTORY, null)),
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).viewHistory(data.record),
  },
  {
    text: 'AbpIdentity::Sessions',
    icon: 'bi bi-laptop',
    permission: IdentityProPolicyNames.Sessions,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).manageSessions(data.record),
  },
  {
    text: 'AbpIdentity::SecurityLogs',
    icon: 'bi bi-journal-text',
    permission: IdentityProPolicyNames.SecurityLogs,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).viewSecurityLogs(data.record),
  },
  {
    text: 'AbpIdentity::LoginWithThisUser',
    permission: IdentityProPolicyNames.UsersImpersonation,
    visible: data =>
      Boolean(
        data &&
        canImpersonateUser(
          data.record,
          data.getInjected(ConfigStateService).snapshot(),
          data.getInjected(EnvironmentService).getEnvironment().oAuthConfig?.impersonation
            ?.userImpersonation === true,
        ),
      ),
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).impersonate(data.record),
  },
  {
    text: 'AbpIdentity::TwoFactor',
    icon: 'bi bi-shield-lock',
    permission: IdentityProPolicyNames.UsersUpdate,
    visible: data =>
      Boolean(data && canManageUserTwoFactor(data.getInjected(ConfigStateService).snapshot())),
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).manageTwoFactor(data.record),
  },
  {
    text: 'AbpUi::Delete',
    icon: 'bi bi-trash',
    permission: IdentityProPolicyNames.UsersDelete,
    visible: data =>
      Boolean(data && canDeleteUser(data.record, data.getInjected(ConfigStateService).snapshot())),
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).remove(data.record),
  },
  {
    text: 'AbpIdentity::RemoveFromTenant',
    permission: IdentityProPolicyNames.UsersDelete,
    visible: data =>
      Boolean(
        data &&
        canRemoveUserFromTenant(data.record, data.getInjected(ConfigStateService).snapshot()),
      ),
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).removeFromTenant(data.record),
  },
]);

export const DEFAULT_IDENTITY_PRO_USERS_TOOLBAR_ACTIONS = ToolbarAction.createMany<
  readonly IdentityUserDto[]
>([
  {
    text: 'AbpIdentity::NewUser',
    icon: 'bi bi-plus',
    permission: IdentityProPolicyNames.UsersCreate,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).add(),
  },
  {
    text: 'AbpIdentity::Search',
    icon: 'bi bi-person-search',
    permission: `${IdentityProPolicyNames.Users} && ${IdentityProPolicyNames.UsersViewDetails}`,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).findUser(),
  },
  {
    text: 'AbpIdentity::InviteUser',
    permission: IdentityProPolicyNames.UsersCreate,
    visible: data =>
      Boolean(data && canInviteUsers(data.getInjected(ConfigStateService).snapshot())),
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).inviteUsers(),
  },
  {
    text: 'AbpIdentity::PendingInvitation',
    permission: IdentityProPolicyNames.UsersCreate,
    visible: data =>
      Boolean(data && canInviteUsers(data.getInjected(ConfigStateService).snapshot())),
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).pendingInvitations(),
  },
  {
    text: 'AbpIdentity::ExternalUser',
    permission: IdentityProPolicyNames.UsersImport,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).importExternalUser(),
  },
  {
    text: 'AbpIdentity::Export',
    icon: 'bi bi-download',
    permission: `${IdentityProPolicyNames.Users} && ${IdentityProPolicyNames.UsersExport}`,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).exportUsers(),
  },
  {
    text: 'AbpIdentity::Import',
    icon: 'bi bi-upload',
    permission: `${IdentityProPolicyNames.Users} && ${IdentityProPolicyNames.UsersImport}`,
    action: data => data.getInjected(IDENTITY_PRO_USERS_PAGE).importUsers(),
  },
]);

export const identityProUsersEntityActionContributor: EntityActionContributorCallback<
  IdentityUserDto
> = list => {
  list.addManyTail(DEFAULT_IDENTITY_PRO_USERS_ENTITY_ACTIONS);
};
export const identityProUsersToolbarActionContributor: ToolbarActionContributorCallback<
  readonly IdentityUserDto[]
> = list => {
  list.addManyTail(DEFAULT_IDENTITY_PRO_USERS_TOOLBAR_ACTIONS);
};
