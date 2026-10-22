import {
  ConfigStateService,
  createInjector,
  PermissionService,
  type ApplicationConfigurationDto,
} from '@lsw-abpvue/core';
import type { IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_IDENTITY_PRO_USERS_CREATE_FORM_PROPS,
  DEFAULT_IDENTITY_PRO_USERS_EDIT_FORM_PROPS,
  DEFAULT_IDENTITY_PRO_USERS_ENTITY_ACTIONS,
  DEFAULT_IDENTITY_PRO_USERS_ENTITY_PROPS,
  DEFAULT_IDENTITY_PRO_USERS_TOOLBAR_ACTIONS,
} from './users.js';
import {
  IDENTITY_PRO_USER_FORM_VALUES,
  IDENTITY_PRO_USERS_PAGE,
} from '../tokens/users-page.token.js';

const user: IdentityUserDto = {
  id: 'other',
  userName: 'other',
  emailConfirmed: true,
  phoneNumberConfirmed: true,
  supportTwoFactor: true,
  twoFactorEnabled: false,
  isActive: true,
  lockoutEnabled: true,
  isLockedOut: true,
  shouldChangePasswordOnNextLogin: true,
  accessFailedCount: 0,
  isExternal: false,
};

function environment() {
  const commands = {
    add: vi.fn(),
    findUser: vi.fn(),
    exportUsers: vi.fn(),
    importUsers: vi.fn(),
    importExternalUser: vi.fn(),
    inviteUsers: vi.fn(),
    pendingInvitations: vi.fn(),
    manageSessions: vi.fn(),
    viewSecurityLogs: vi.fn(),
    viewHistory: vi.fn(),
    impersonate: vi.fn(),
    removeFromTenant: vi.fn(),
    viewDetails: vi.fn(),
    edit: vi.fn(),
    remove: vi.fn(),
    managePermissions: vi.fn(),
    manageClaims: vi.fn(),
    lock: vi.fn(),
    unlock: vi.fn(),
    setPassword: vi.fn(),
    manageTwoFactor: vi.fn(),
  };
  const values: Record<string, unknown> = { phoneNumber: '123' };
  const injector = createInjector([
    { provide: IDENTITY_PRO_USERS_PAGE, useValue: commands },
    { provide: IDENTITY_PRO_USER_FORM_VALUES, useValue: () => values },
  ]);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { ...config.snapshot().currentUser, id: 'admin' },
    features: { values: { 'Identity.TwoFactor': 'Optional' } },
    setting: { values: { 'Abp.Identity.TwoFactor.Behaviour': 'Optional' } },
  });
  return {
    injector,
    config,
    values,
    commands,
    data: { record: user, getInjected: injector.get.bind(injector) },
  };
}

describe('commercial user defaults', () => {
  it('shows the external import action for import permission independently of creation', () => {
    const { config, injector } = environment();
    const action = DEFAULT_IDENTITY_PRO_USERS_TOOLBAR_ACTIONS.find(
      item => item.text === 'AbpIdentity::ExternalUser',
    );
    expect(action?.permission).toBe('AbpIdentity.Users.Import');
    const permission = injector.get(PermissionService);
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users': true, 'AbpIdentity.Users.Create': true } },
    });
    expect(permission.isGranted(action?.permission ?? '')).toBe(false);
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users': true, 'AbpIdentity.Users.Import': true } },
    });
    expect(permission.isGranted(action?.permission ?? '')).toBe(true);
    injector.destroy();
  });
  it('provides all commercial columns and keeps update password outside the edit form', () => {
    expect(DEFAULT_IDENTITY_PRO_USERS_ENTITY_PROPS.map(prop => prop.name)).toEqual([
      'userName',
      'email',
      'roleNames',
      'phoneNumber',
      'name',
      'surname',
      'isActive',
      'lockoutEnabled',
      'emailConfirmed',
      'twoFactorEnabled',
      'accessFailedCount',
      'creationTime',
      'lastModificationTime',
    ]);
    expect(DEFAULT_IDENTITY_PRO_USERS_CREATE_FORM_PROPS.map(prop => prop.name)).toContain(
      'password',
    );
    expect(DEFAULT_IDENTITY_PRO_USERS_EDIT_FORM_PROPS.map(prop => prop.name)).not.toContain(
      'password',
    );
    expect(DEFAULT_IDENTITY_PRO_USERS_EDIT_FORM_PROPS.map(prop => prop.name)).toContain(
      'shouldChangePasswordOnNextLogin',
    );
  });

  it('uses current phone values and protects host-managed fields in shared tenants', () => {
    const { injector, config, values, data } = environment();
    const phone = DEFAULT_IDENTITY_PRO_USERS_EDIT_FORM_PROPS.find(
      prop => prop.name === 'phoneNumberConfirmed',
    );
    expect(phone?.disabled(data)).toBe(false);
    values.phoneNumber = ' ';
    expect(phone?.disabled(data)).toBe(true);
    const state: ApplicationConfigurationDto = config.snapshot();
    config.setState({
      ...state,
      multiTenancy: { ...state.multiTenancy, userSharingStrategy: 1 },
      currentTenant: { id: 'tenant', isAvailable: true },
    });
    for (const name of ['isActive', 'lockoutEnabled', 'shouldChangePasswordOnNextLogin']) {
      expect(
        DEFAULT_IDENTITY_PRO_USERS_EDIT_FORM_PROPS.find(prop => prop.name === name)?.disabled(data),
      ).toBe(true);
    }
    injector.destroy();
  });

  it('dispatches actions through the commercial page commands and retains update policy on two factor', () => {
    const { injector, commands, data } = environment();
    for (const action of DEFAULT_IDENTITY_PRO_USERS_ENTITY_ACTIONS) action.action(data);
    for (const command of Object.values(commands).filter(
      command =>
        ![
          commands.add,
          commands.findUser,
          commands.exportUsers,
          commands.importUsers,
          commands.importExternalUser,
          commands.inviteUsers,
          commands.pendingInvitations,
        ].includes(command),
    ))
      expect(command).toHaveBeenCalledExactlyOnceWith(user);
    for (const action of DEFAULT_IDENTITY_PRO_USERS_TOOLBAR_ACTIONS)
      action.action({ ...data, record: [user] });
    for (const command of [
      commands.add,
      commands.findUser,
      commands.exportUsers,
      commands.importUsers,
      commands.importExternalUser,
      commands.inviteUsers,
      commands.pendingInvitations,
    ])
      expect(command).toHaveBeenCalledExactlyOnceWith();
    expect(
      DEFAULT_IDENTITY_PRO_USERS_ENTITY_ACTIONS.find(
        action => action.text === 'AbpIdentity::TwoFactor',
      )?.permission,
    ).toBe('AbpIdentity.Users.Update');
    injector.destroy();
  });

  it('preserves enabled lock adjustment and hides destructive operations from shared tenants', () => {
    const { injector, config, data } = environment();
    const visible = () =>
      DEFAULT_IDENTITY_PRO_USERS_ENTITY_ACTIONS.filter(action => action.visible(data)).map(
        action => action.text,
      );
    expect(visible()).toContain('AbpIdentity::Lock');
    expect(visible()).toContain('AbpIdentity::Unlock');
    config.setState({
      ...config.snapshot(),
      multiTenancy: { isEnabled: true, userSharingStrategy: 1 },
      currentTenant: { id: 'tenant', isAvailable: true },
    });
    for (const name of [
      'AbpIdentity::Lock',
      'AbpIdentity::Unlock',
      'AbpIdentity::TwoFactor',
      'AbpUi::Delete',
    ])
      expect(visible()).not.toContain(name);
    expect(visible()).toContain('AbpUi::Edit');
    expect(visible()).toContain('AbpIdentity::SetPassword');
    injector.destroy();
  });
});
