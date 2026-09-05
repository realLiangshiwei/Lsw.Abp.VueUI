import {
  createNavTree,
  defineService,
  inject,
  NAV_COMPARE_FN,
  PermissionService,
  type NavTree,
  type ServiceOf,
} from '@lsw-abpvue/core';
import type { NavItem } from '../models/nav-item.js';

/**
 * The same tree the routes are kept in, minus the grouping. Reading the permission state
 * inside `hide` is what makes an item appear the moment a login grants its policy.
 */
function createNavItemTree(): NavTree<NavItem> {
  const permission = inject(PermissionService);
  const sort = inject(NAV_COMPARE_FN);

  return createNavTree<NavItem>({
    hide: item =>
      item.invisible === true ||
      !permission.isGranted(item.requiredPolicy) ||
      item.visible?.() === false,
    sort,
  });
}

/** What sits on the right of the navbar: the language switcher, the user's name. */
export const NavItemsService = defineService('NavItemsService', createNavItemTree);
export type NavItemsService = ServiceOf<typeof NavItemsService>;

export const useNavItems = (): NavItemsService => inject(NavItemsService);

/** What is under the user's name: the profile link, logging out. */
export const UserMenuService = defineService('UserMenuService', createNavItemTree);
export type UserMenuService = ServiceOf<typeof UserMenuService>;

export const useUserMenu = (): UserMenuService => inject(UserMenuService);
