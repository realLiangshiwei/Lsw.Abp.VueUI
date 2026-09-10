import { defineToken } from '@lsw-abpvue/core';
import type {
  EntityActionContributorCallbacks,
  EntityPropContributorCallbacks,
  FormPropContributorCallbacks,
  ToolbarActionContributorCallbacks,
} from '@lsw-abpvue/components';
import type { DemoUserDto } from '../services/users.service.js';

/**
 * The five tokens a module exposes for a host to contribute through. A module package
 * ships exactly these; `provideIdentityDemo()` is what fills them in.
 */
export const IDENTITY_ENTITY_PROP_CONTRIBUTORS = defineToken<
  EntityPropContributorCallbacks<DemoUserDto>
>('IDENTITY_ENTITY_PROP_CONTRIBUTORS');

export const IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS = defineToken<
  FormPropContributorCallbacks<DemoUserDto>
>('IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS');

export const IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS = defineToken<
  FormPropContributorCallbacks<DemoUserDto>
>('IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS');

export const IDENTITY_ENTITY_ACTION_CONTRIBUTORS = defineToken<
  EntityActionContributorCallbacks<DemoUserDto>
>('IDENTITY_ENTITY_ACTION_CONTRIBUTORS');

export const IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS = defineToken<
  ToolbarActionContributorCallbacks<readonly DemoUserDto[]>
>('IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS');

/** What the page offers the row and toolbar buttons: the module's own commands. */
export interface UsersPageCommands {
  add(): void;
  edit(user: DemoUserDto): void;
  remove(user: DemoUserDto): Promise<void>;
}

export const USERS_PAGE = defineToken<UsersPageCommands>('USERS_PAGE');
