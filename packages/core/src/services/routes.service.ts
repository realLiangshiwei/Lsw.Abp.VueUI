import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import type { AbpRoute } from '../models/nav';
import { NAV_COMPARE_FN } from '../tokens/nav.token';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token';
import { createNavTree } from '../utils/nav-tree';
import { PermissionService } from './permission.service';

/**
 * The application's routes as a tree, which is what the menu is rendered from. Modules
 * add theirs from their `/config` entry at startup; the host can patch or remove any of
 * them by name.
 */
export const RoutesService = defineService('RoutesService', () => {
  const permission = inject(PermissionService);
  const options = inject(ABP_ROOT_OPTIONS);
  const sort = inject(NAV_COMPARE_FN);

  return createNavTree<AbpRoute>({
    // Reading the permission state here is what makes `visible` recompute after a login
    // or a tenant switch, with nothing subscribed to anything.
    hide: route => route.invisible === true || !permission.isGranted(route.requiredPolicy),
    sort,
    othersGroup: options.othersGroup,
  });
});
export type RoutesService = ServiceOf<typeof RoutesService>;

export const useRoutes = (): RoutesService => inject(RoutesService);
