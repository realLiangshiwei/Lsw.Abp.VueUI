import { defineToken } from '@lsw-abpvue/core';
import type { IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';

/** The commercial user operations contributed to the identity page. */
export interface IdentityProUsersPageCommands {
  add(): void;
  findUser(): void;
  exportUsers(): void;
  importUsers(): void;
  importExternalUser(): void;
  inviteUsers(): void;
  pendingInvitations(): void;
  removeFromTenant(user: IdentityUserDto): Promise<void>;
  impersonate(user: IdentityUserDto): Promise<void>;
  viewDetails(user: IdentityUserDto): void;
  edit(user: IdentityUserDto): Promise<void>;
  remove(user: IdentityUserDto): Promise<void>;
  managePermissions(user: IdentityUserDto): void;
  manageClaims(user: IdentityUserDto): void;
  manageSessions(user: IdentityUserDto): void;
  viewSecurityLogs(user: IdentityUserDto): void;
  viewHistory(user: IdentityUserDto): void;
  lock(user: IdentityUserDto): void;
  unlock(user: IdentityUserDto): void;
  setPassword(user: IdentityUserDto): void;
  manageTwoFactor(user: IdentityUserDto): void;
}

export const IDENTITY_PRO_USERS_PAGE =
  defineToken<IdentityProUsersPageCommands>('IDENTITY_PRO_USERS_PAGE');

/** Reads the current form values for predicates that depend on another control. */
export const IDENTITY_PRO_USER_FORM_VALUES = defineToken<() => Readonly<Record<string, unknown>>>(
  'IDENTITY_PRO_USER_FORM_VALUES',
);
