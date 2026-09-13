import type { PermissionGrantInfoDto } from '@lsw-abpvue/permission-management/proxy';
import type { CheckboxState, GroupedPermission, PermissionGroups } from '../models/permission.js';

/** How far one level of the hierarchy is indented, in pixels; ABP's own step. */
export const INDENT_STEP = 20;

function depthOf(byName: Map<string, PermissionGrantInfoDto>, name: string | undefined): number {
  let depth = 0;
  let current = name ? byName.get(name) : undefined;

  // A cycle cannot happen in what the server sends, but a bounded walk is cheap.
  while (current && depth < 16) {
    depth += 1;
    current = current.parentName ? byName.get(current.parentName) : undefined;
  }

  return depth;
}

/**
 * Every permission of every group, flattened, with the group it belongs to and its depth
 * in the hierarchy. The flat list is the working copy the dialog edits; the groups are
 * only what the tabs are made of.
 * @param groups What `PermissionsService.get` answered with
 */
export function flatten(groups: PermissionGroups): GroupedPermission[] {
  const all = groups.flatMap(group => group.permissions ?? []);
  const byName = new Map(all.map(permission => [permission.name ?? '', permission]));

  return groups.flatMap(group =>
    (group.permissions ?? []).map(permission => ({
      ...permission,
      groupName: group.name ?? '',
      depth: depthOf(byName, permission.parentName),
    })),
  );
}

/**
 * Whether something other than the provider being edited is what grants this. A role's
 * permission showing up on a user is the everyday case: it is granted, and this dialog
 * is not where it can be taken away.
 * @param permission The permission to judge
 * @param providerName The provider being edited, `U` or `R`
 */
export function isGrantedElsewhere(
  permission: PermissionGrantInfoDto,
  providerName: string,
): boolean {
  return (permission.grantedProviders ?? []).some(granted => granted.providerName !== providerName);
}

function descendantsOf(permissions: readonly GroupedPermission[], name: string): Set<string> {
  const names = new Set([name]);
  let grew = true;

  while (grew) {
    grew = false;
    for (const permission of permissions) {
      if (
        permission.parentName &&
        names.has(permission.parentName) &&
        !names.has(permission.name ?? '')
      ) {
        names.add(permission.name ?? '');
        grew = true;
      }
    }
  }

  names.delete(name);
  return names;
}

function ancestorsOf(permissions: readonly GroupedPermission[], name: string): Set<string> {
  const byName = new Map(permissions.map(permission => [permission.name ?? '', permission]));
  const names = new Set<string>();
  let current = byName.get(name)?.parentName;

  while (current && !names.has(current)) {
    names.add(current);
    current = byName.get(current)?.parentName;
  }

  return names;
}

/**
 * Flips one permission and everything that follows from it: granting one grants its
 * parents, because a permission whose parent is refused is refused; revoking one revokes
 * everything under it, for the same reason read the other way.
 * @param permissions The working copy
 * @param name The permission that was clicked
 */
export function toggle(
  permissions: readonly GroupedPermission[],
  name: string,
): GroupedPermission[] {
  const clicked = permissions.find(permission => permission.name === name);
  if (!clicked) return [...permissions];

  const granting = !clicked.isGranted;
  const affected = granting ? ancestorsOf(permissions, name) : descendantsOf(permissions, name);

  return permissions.map(permission =>
    permission.name === name || affected.has(permission.name ?? '')
      ? { ...permission, isGranted: granting }
      : permission,
  );
}

/**
 * Grants or revokes a whole set at once. What another provider grants stays granted:
 * this dialog cannot take away what it did not give.
 * @param permissions The working copy
 * @param names Which permissions the checkbox covers
 * @param granting Whether they are being granted or revoked
 * @param providerName The provider being edited
 */
export function setMany(
  permissions: readonly GroupedPermission[],
  names: ReadonlySet<string>,
  granting: boolean,
  providerName: string,
): GroupedPermission[] {
  return permissions.map(permission =>
    names.has(permission.name ?? '')
      ? {
          ...permission,
          isGranted: granting || isGrantedElsewhere(permission, providerName),
        }
      : permission,
  );
}

/** @param permissions The set the checkbox covers */
export function checkboxState(permissions: readonly PermissionGrantInfoDto[]): CheckboxState {
  const granted = permissions.filter(permission => permission.isGranted).length;

  if (granted === 0) return { checked: false, indeterminate: false };
  if (granted === permissions.length) return { checked: true, indeterminate: false };

  return { checked: false, indeterminate: true };
}

/**
 * Whether a "select all" has nothing left to do: everything is granted, and none of it
 * by the provider being edited, so every checkbox under it is already disabled.
 * @param permissions The set the checkbox covers
 * @param providerName The provider being edited
 */
export function isSelectAllDisabled(
  permissions: readonly PermissionGrantInfoDto[],
  providerName: string,
): boolean {
  return (
    permissions.length > 0 &&
    permissions.every(
      permission => permission.isGranted && isGrantedElsewhere(permission, providerName),
    )
  );
}

/**
 * What the save request has to carry: the permissions whose grant differs from what the
 * server answered with. Sending the rest back would be a no-op the server still audits.
 * @param original What the server answered with
 * @param current The working copy
 */
export function changesBetween(
  original: readonly PermissionGrantInfoDto[],
  current: readonly PermissionGrantInfoDto[],
): { name: string; isGranted: boolean }[] {
  const before = new Map(original.map(permission => [permission.name ?? '', permission.isGranted]));

  return current
    .filter(permission => before.get(permission.name ?? '') !== permission.isGranted)
    .map(permission => ({ name: permission.name ?? '', isGranted: permission.isGranted }));
}

/**
 * The groups a filter leaves, matched on the group's name and on the permissions in it,
 * the way ABP's own search does.
 * @param groups Every group the server sent
 * @param filter What was typed
 */
export function matchingGroups(groups: PermissionGroups, filter: string): PermissionGroups {
  const needle = filter.trim().toLowerCase();
  if (!needle) return groups;

  const matches = (text: string | undefined) => (text ?? '').toLowerCase().includes(needle);

  return groups.filter(
    group =>
      matches(group.displayName) ||
      (group.permissions ?? []).some(permission => matches(permission.displayName)),
  );
}
