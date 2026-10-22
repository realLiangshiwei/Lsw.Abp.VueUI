import type { ApplicationConfiguration } from '@lsw-abpvue/core';
import type { IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';

/** The effective configuration used by commercial user operation guards. */
export type IdentityProUserOperationContext = Pick<
  ApplicationConfiguration,
  'multiTenancy' | 'currentTenant' | 'currentUser' | 'features' | 'setting'
>;

export function canManageHostLevelUserOperations(
  context: IdentityProUserOperationContext,
): boolean {
  return context.multiTenancy.userSharingStrategy !== 1 || !context.currentTenant.id;
}

export function canManageUserTwoFactor(context: IdentityProUserOperationContext): boolean {
  return (
    canManageHostLevelUserOperations(context) &&
    context.features.values['Identity.TwoFactor'] === 'Optional' &&
    context.setting.values['Abp.Identity.TwoFactor.Behaviour'] === 'Optional'
  );
}

export function canLockUser(
  user: IdentityUserDto,
  context: IdentityProUserOperationContext,
): boolean {
  return (
    canManageHostLevelUserOperations(context) &&
    user.id !== context.currentUser.id &&
    user.lockoutEnabled
  );
}

export function isUserLockedOut(user: IdentityUserDto): boolean {
  return (
    user.lockoutEnabled &&
    (user.isLockedOut || Boolean(user.lockoutEnd && Date.parse(user.lockoutEnd) > Date.now()))
  );
}

export function canUnlockUser(
  user: IdentityUserDto,
  context: IdentityProUserOperationContext,
): boolean {
  return canManageHostLevelUserOperations(context) && isUserLockedOut(user);
}

export function canDeleteUser(
  user: IdentityUserDto,
  context: IdentityProUserOperationContext,
): boolean {
  return canManageHostLevelUserOperations(context) && user.id !== context.currentUser.id;
}

export function canInviteUsers(context: IdentityProUserOperationContext): boolean {
  return context.multiTenancy.userSharingStrategy === 1 && Boolean(context.currentTenant.id);
}

export function canRemoveUserFromTenant(
  user: IdentityUserDto,
  context: IdentityProUserOperationContext,
): boolean {
  return canInviteUsers(context) && user.id !== context.currentUser.id;
}

export function canImpersonateUser(
  user: IdentityUserDto,
  context: IdentityProUserOperationContext,
  enabled: boolean,
): boolean {
  return (
    enabled &&
    Boolean(user.id) &&
    user.id !== context.currentUser.id &&
    !context.currentUser.impersonatorUserId &&
    !context.currentUser.impersonatorTenantId
  );
}
