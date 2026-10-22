import { createInjector } from '@lsw-abpvue/core';
import type { IdentityRoleDto } from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_IDENTITY_PRO_ROLES_CREATE_FORM_PROPS,
  DEFAULT_IDENTITY_PRO_ROLES_EDIT_FORM_PROPS,
  DEFAULT_IDENTITY_PRO_ROLES_ENTITY_ACTIONS,
  DEFAULT_IDENTITY_PRO_ROLES_ENTITY_PROPS,
  DEFAULT_IDENTITY_PRO_ROLES_TOOLBAR_ACTIONS,
} from './roles.js';
import { IDENTITY_PRO_ROLES_PAGE } from '../tokens/roles-page.token.js';

const role: IdentityRoleDto = {
  id: 'role',
  name: 'name',
  isStatic: false,
  isDefault: true,
  isPublic: true,
  userCount: 2,
  creationTime: '2026-01-01T00:00:00Z',
};
describe('commercial role defaults', () => {
  it('matches commercial columns, fields and row action order', () => {
    expect(DEFAULT_IDENTITY_PRO_ROLES_ENTITY_PROPS.map(prop => prop.name)).toEqual([
      'name',
      'userCount',
    ]);
    expect(DEFAULT_IDENTITY_PRO_ROLES_ENTITY_PROPS[0]?.component).toBeDefined();
    for (const props of [
      DEFAULT_IDENTITY_PRO_ROLES_CREATE_FORM_PROPS,
      DEFAULT_IDENTITY_PRO_ROLES_EDIT_FORM_PROPS,
    ])
      expect(props.map(prop => prop.name)).toEqual(['name', 'isDefault', 'isPublic']);
    expect(
      DEFAULT_IDENTITY_PRO_ROLES_ENTITY_ACTIONS.map(action => [action.text, action.permission]),
    ).toEqual([
      [
        'AbpIdentity::ChangeHistory',
        'AuditLogging.ViewChangeHistory:Volo.Abp.Identity.IdentityRole',
      ],
      ['AbpUi::Edit', 'AbpIdentity.Roles.Update'],
      ['AbpIdentity::Claims', 'AbpIdentity.Roles.Update'],
      ['AbpIdentity::Permissions', 'AbpIdentity.Roles.ManagePermissions'],
      ['AbpUi::Delete', 'AbpIdentity.Roles.Delete'],
      ['AbpIdentity::MoveAllUsers', 'AbpIdentity.Roles.Update'],
    ]);
  });
  it('dispatches actions to commercial commands and protects static roles', () => {
    const commands = {
      add: vi.fn(),
      edit: vi.fn(),
      remove: vi.fn(),
      managePermissions: vi.fn(),
      manageClaims: vi.fn(),
      moveAllUsers: vi.fn(),
      viewHistory: vi.fn(),
    };
    const injector = createInjector([{ provide: IDENTITY_PRO_ROLES_PAGE, useValue: commands }]);
    const data = { record: role, getInjected: injector.get.bind(injector) };
    for (const action of DEFAULT_IDENTITY_PRO_ROLES_ENTITY_ACTIONS) action.action(data);
    for (const [name, command] of Object.entries(commands))
      if (name !== 'add') expect(command).toHaveBeenCalledExactlyOnceWith(role);
    DEFAULT_IDENTITY_PRO_ROLES_TOOLBAR_ACTIONS[0]?.action({ ...data, record: [role] });
    expect(commands.add).toHaveBeenCalledExactlyOnceWith();
    const staticData = { ...data, record: { ...role, isStatic: true } };
    expect(
      DEFAULT_IDENTITY_PRO_ROLES_ENTITY_ACTIONS.find(
        action => action.text === 'AbpUi::Delete',
      )?.visible(staticData),
    ).toBe(false);
    expect(DEFAULT_IDENTITY_PRO_ROLES_EDIT_FORM_PROPS[0]?.disabled(staticData)).toBe(true);
    injector.destroy();
  });
});
