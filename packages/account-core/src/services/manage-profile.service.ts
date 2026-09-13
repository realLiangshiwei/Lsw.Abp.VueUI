import {
  createNavTree,
  defineService,
  inject,
  InternalStore,
  NAV_COMPARE_FN,
  PermissionService,
  type NavTree,
  type ServiceOf,
} from '@lsw-abpvue/core';
import type { ComputedRef } from 'vue';
import type { ProfileDto } from '@lsw-abpvue/account-core/proxy';
import type { ProfileTab } from '../models/profile-tab.js';

/**
 * The tabs of the profile page, as a tree. A module that has something to say about the
 * signed-in user -- a security log, a set of linked accounts -- adds a tab here instead
 * of replacing the page.
 */
export const ManageProfileTabsService = defineService(
  'ManageProfileTabsService',
  (): NavTree<ProfileTab> => {
    const permission = inject(PermissionService);
    const sort = inject(NAV_COMPARE_FN);

    return createNavTree<ProfileTab>({
      hide: tab =>
        tab.invisible === true ||
        !permission.isGranted(tab.requiredPolicy) ||
        tab.visible?.() === false,
      sort,
    });
  },
);
export type ManageProfileTabsService = ServiceOf<typeof ManageProfileTabsService>;

export const useManageProfileTabs = (): ManageProfileTabsService =>
  inject(ManageProfileTabsService);

/**
 * The profile the page is showing, so every tab edits the same one. A tab that saves
 * puts what the server answered back here, and the others see it.
 */
export const ManageProfileStateService = defineService('ManageProfileStateService', () => {
  const store = new InternalStore<{ profile: ProfileDto | null }>({ profile: null });

  return {
    profile: store.slice(state => state.profile) as ComputedRef<ProfileDto | null>,
    set: (profile: ProfileDto | null): void => store.patch({ profile }),
  };
});
export type ManageProfileStateService = ServiceOf<typeof ManageProfileStateService>;

export const useManageProfileState = (): ManageProfileStateService =>
  inject(ManageProfileStateService);
