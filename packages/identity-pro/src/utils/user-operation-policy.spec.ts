import { ConfigStateService, createInjector } from '@lsw-abpvue/core';
import type { IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it } from 'vitest';
import {
  canDeleteUser,
  canLockUser,
  canManageHostLevelUserOperations,
  canManageUserTwoFactor,
  canUnlockUser,
} from './user-operation-policy.js';

const user: IdentityUserDto = {
  id: 'other',
  emailConfirmed: false,
  phoneNumberConfirmed: false,
  supportTwoFactor: true,
  twoFactorEnabled: false,
  isActive: true,
  lockoutEnabled: true,
  isLockedOut: true,
  shouldChangePasswordOnNextLogin: false,
  accessFailedCount: 0,
  isExternal: false,
};

function configuration() {
  const injector = createInjector([]);
  const state = injector.get(ConfigStateService).snapshot();
  injector.destroy();
  return {
    ...state,
    currentUser: { ...state.currentUser, id: 'admin' },
    features: { values: { 'Identity.TwoFactor': 'Optional' } },
    setting: { values: { 'Abp.Identity.TwoFactor.Behaviour': 'Optional' } },
  };
}

describe('commercial user operation policies', () => {
  it('blocks host operations only for shared tenant contexts', () => {
    const state = configuration();
    state.multiTenancy.userSharingStrategy = 1;
    expect(canManageHostLevelUserOperations(state)).toBe(true);
    state.currentTenant.id = 'tenant';
    expect(canManageHostLevelUserOperations(state)).toBe(false);
    expect(canLockUser(user, state)).toBe(false);
    expect(canUnlockUser(user, state)).toBe(false);
    expect(canDeleteUser(user, state)).toBe(false);
    expect(canManageUserTwoFactor(state)).toBe(false);
    state.multiTenancy.userSharingStrategy = 0;
    expect(canManageHostLevelUserOperations(state)).toBe(true);
  });

  it('allows changing an existing lock while preventing locking or deleting oneself', () => {
    const state = configuration();
    expect(canLockUser(user, state)).toBe(true);
    expect(canUnlockUser(user, state)).toBe(true);
    expect(canDeleteUser(user, state)).toBe(true);
    expect(canLockUser({ ...user, id: 'admin' }, state)).toBe(false);
    expect(canDeleteUser({ ...user, id: 'admin' }, state)).toBe(false);
    expect(canLockUser({ ...user, lockoutEnabled: false }, state)).toBe(false);
    expect(canUnlockUser({ ...user, isLockedOut: false }, state)).toBe(false);
  });

  it('offers unlock for a future lockout end when the response flag is stale', () => {
    const locked = {
      ...user,
      isLockedOut: false,
      lockoutEnd: new Date(Date.now() + 60_000).toISOString(),
    };
    expect(canUnlockUser(locked, configuration())).toBe(true);
    expect(canUnlockUser({ ...locked, lockoutEnd: '2000-01-01T00:00:00Z' }, configuration())).toBe(
      false,
    );
    expect(canUnlockUser({ ...locked, lockoutEnabled: false }, configuration())).toBe(false);
  });

  it.each(['Disabled', 'Forced', '0', 'optional', ''])(
    'requires both optional strings instead of %s',
    value => {
      const state = configuration();
      expect(canManageUserTwoFactor(state)).toBe(true);
      state.features.values['Identity.TwoFactor'] = value;
      expect(canManageUserTwoFactor(state)).toBe(false);
      state.features.values['Identity.TwoFactor'] = 'Optional';
      state.setting.values['Abp.Identity.TwoFactor.Behaviour'] = value;
      expect(canManageUserTwoFactor(state)).toBe(false);
    },
  );
});
