import { describe, expect, it } from 'vitest';
import type { GroupedPermission, PermissionGroups } from '../models/permission.js';
import {
  changesBetween,
  checkboxState,
  flatten,
  isGrantedElsewhere,
  isSelectAllDisabled,
  matchingGroups,
  setMany,
  toggle,
} from './permissions.js';

const GROUPS: PermissionGroups = [
  {
    name: 'AbpIdentity',
    displayName: 'Identity management',
    permissions: [
      {
        name: 'AbpIdentity.Roles',
        displayName: 'Role management',
        isGranted: false,
        isEditable: true,
      },
      {
        name: 'AbpIdentity.Roles.Create',
        parentName: 'AbpIdentity.Roles',
        displayName: 'Create',
        isGranted: false,
        isEditable: true,
      },
      {
        name: 'AbpIdentity.Roles.Create.Bulk',
        parentName: 'AbpIdentity.Roles.Create',
        displayName: 'Bulk',
        isGranted: false,
        isEditable: true,
      },
    ],
  },
  {
    name: 'AbpTenantManagement',
    displayName: 'Tenant management',
    permissions: [
      {
        name: 'AbpTenantManagement.Tenants',
        displayName: 'Tenants',
        isGranted: true,
        isEditable: true,
        grantedProviders: [{ providerName: 'R', providerKey: 'admin' }],
      },
    ],
  },
];

const permissions = () => flatten(GROUPS);
const grantOf = (list: readonly GroupedPermission[], name: string) =>
  list.find(permission => permission.name === name)?.isGranted;

describe('flatten', () => {
  it('carries the group name and the depth of every permission', () => {
    expect(
      permissions().map(permission => [permission.name, permission.groupName, permission.depth]),
    ).toEqual([
      ['AbpIdentity.Roles', 'AbpIdentity', 0],
      ['AbpIdentity.Roles.Create', 'AbpIdentity', 1],
      ['AbpIdentity.Roles.Create.Bulk', 'AbpIdentity', 2],
      ['AbpTenantManagement.Tenants', 'AbpTenantManagement', 0],
    ]);
  });

  it('is empty for groups with no permissions', () => {
    expect(flatten([{ name: 'Empty', displayName: 'Empty' }])).toEqual([]);
  });
});

describe('toggle', () => {
  it('grants every parent of the permission that was granted', () => {
    const after = toggle(permissions(), 'AbpIdentity.Roles.Create.Bulk');

    expect(grantOf(after, 'AbpIdentity.Roles.Create.Bulk')).toBe(true);
    expect(grantOf(after, 'AbpIdentity.Roles.Create')).toBe(true);
    expect(grantOf(after, 'AbpIdentity.Roles')).toBe(true);
  });

  it('revokes everything under the permission that was revoked', () => {
    const granted = toggle(permissions(), 'AbpIdentity.Roles.Create.Bulk');
    const after = toggle(granted, 'AbpIdentity.Roles');

    expect(grantOf(after, 'AbpIdentity.Roles')).toBe(false);
    expect(grantOf(after, 'AbpIdentity.Roles.Create')).toBe(false);
    expect(grantOf(after, 'AbpIdentity.Roles.Create.Bulk')).toBe(false);
  });

  it('leaves permissions in other branches alone', () => {
    const after = toggle(permissions(), 'AbpIdentity.Roles');

    expect(grantOf(after, 'AbpTenantManagement.Tenants')).toBe(true);
  });

  it('is a no-op for a name nothing goes by', () => {
    expect(toggle(permissions(), 'Nothing.Like.This')).toEqual(permissions());
  });
});

describe('isGrantedElsewhere', () => {
  it('is true when another provider is what grants it', () => {
    const tenants = permissions()[3] as GroupedPermission;

    expect(isGrantedElsewhere(tenants, 'U')).toBe(true);
    expect(isGrantedElsewhere(tenants, 'R')).toBe(false);
  });

  it('is false when nothing grants it at all', () => {
    expect(isGrantedElsewhere(permissions()[0] as GroupedPermission, 'U')).toBe(false);
  });
});

describe('setMany', () => {
  it('grants what the checkbox covers and nothing else', () => {
    const after = setMany(permissions(), new Set(['AbpIdentity.Roles']), true, 'U');

    expect(grantOf(after, 'AbpIdentity.Roles')).toBe(true);
    expect(grantOf(after, 'AbpIdentity.Roles.Create')).toBe(false);
  });

  it('cannot revoke what another provider grants', () => {
    const names = new Set(['AbpTenantManagement.Tenants']);
    const after = setMany(permissions(), names, false, 'U');

    expect(grantOf(after, 'AbpTenantManagement.Tenants')).toBe(true);
  });
});

describe('checkboxState', () => {
  it('is off, partly on and on', () => {
    const none = permissions().slice(0, 3);
    const some = toggle(none, 'AbpIdentity.Roles');
    const all = setMany(none, new Set(none.map(p => p.name ?? '')), true, 'U');

    expect(checkboxState(none)).toEqual({ checked: false, indeterminate: false });
    expect(checkboxState(some)).toEqual({ checked: false, indeterminate: true });
    expect(checkboxState(all)).toEqual({ checked: true, indeterminate: false });
  });

  it('is off for nothing at all', () => {
    expect(checkboxState([])).toEqual({ checked: false, indeterminate: false });
  });
});

describe('isSelectAllDisabled', () => {
  it('is true when every permission is granted by someone else', () => {
    expect(isSelectAllDisabled(permissions().slice(3), 'U')).toBe(true);
    expect(isSelectAllDisabled(permissions().slice(3), 'R')).toBe(false);
  });

  it('is false when there is nothing to select', () => {
    expect(isSelectAllDisabled([], 'U')).toBe(false);
  });
});

describe('changesBetween', () => {
  it('names only what changed', () => {
    const before = permissions();
    const after = toggle(before, 'AbpIdentity.Roles.Create');

    expect(changesBetween(before, after)).toEqual([
      { name: 'AbpIdentity.Roles', isGranted: true },
      { name: 'AbpIdentity.Roles.Create', isGranted: true },
    ]);
  });

  it('is empty when nothing was touched', () => {
    expect(changesBetween(permissions(), permissions())).toEqual([]);
  });
});

describe('matchingGroups', () => {
  it('keeps a group whose own name matches', () => {
    expect(matchingGroups(GROUPS, 'tenant').map(group => group.name)).toEqual([
      'AbpTenantManagement',
    ]);
  });

  it('keeps a group one of whose permissions matches', () => {
    expect(matchingGroups(GROUPS, 'bulk').map(group => group.name)).toEqual(['AbpIdentity']);
  });

  it('keeps everything when nothing was typed', () => {
    expect(matchingGroups(GROUPS, '  ')).toEqual(GROUPS);
  });
});
