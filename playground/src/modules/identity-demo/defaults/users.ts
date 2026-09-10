import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
} from '@lsw-abpvue/components';
import { Validators } from '@lsw-abpvue/theme-shared';
import type { DemoUserDto } from '../services/users.service.js';
import { USERS_PAGE } from '../tokens/extensions.token.js';
import UserNameCell from '../pages/UserNameCell.vue';

/**
 * What the module itself puts on the page. A host never edits this file -- it registers
 * contributors, and they run after these (design 05 §4).
 */
export const DEFAULT_USERS_ENTITY_PROPS = EntityProp.createMany<DemoUserDto>([
  {
    type: PropType.String,
    name: 'userName',
    displayName: 'AbpIdentity::UserName',
    sortable: true,
    columnWidth: 250,
    // ABP's own column marks an inactive user with an icon. Angular builds that as an
    // HTML string and renders it with `innerHTML`; here it is a component (difference 2).
    component: UserNameCell,
  },
  {
    type: PropType.String,
    name: 'email',
    displayName: 'AbpIdentity::EmailAddress',
    sortable: true,
    columnWidth: 250,
  },
]);

export const DEFAULT_USERS_FORM_PROPS = FormProp.createMany<DemoUserDto>([
  {
    type: PropType.String,
    name: 'userName',
    displayName: 'AbpIdentity::UserName',
    validators: () => [Validators.required(), Validators.maxLength(64)],
  },
  {
    type: PropType.Email,
    name: 'email',
    displayName: 'AbpIdentity::EmailAddress',
    validators: () => [Validators.required(), Validators.email()],
  },
  {
    type: PropType.Boolean,
    name: 'isActive',
    displayName: 'AbpIdentity::DisplayName:IsActive',
    defaultValue: true,
  },
]);

export const DEFAULT_USERS_ENTITY_ACTIONS = EntityAction.createMany<DemoUserDto>([
  {
    text: 'AbpIdentity::Edit',
    icon: 'bi bi-pencil',
    action: data => data.getInjected(USERS_PAGE).edit(data.record),
  },
  {
    text: 'AbpIdentity::Delete',
    icon: 'bi bi-trash',
    action: data => data.getInjected(USERS_PAGE).remove(data.record),
    // ABP hides the delete button on the account you are signed in as.
    visible: data => data?.record.userName !== 'admin',
  },
]);

export const DEFAULT_USERS_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly DemoUserDto[]>([
  {
    text: 'AbpIdentity::NewUser',
    icon: 'bi bi-plus',
    action: data => data.getInjected(USERS_PAGE).add(),
  },
]);
