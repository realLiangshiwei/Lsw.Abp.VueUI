import { defineToken } from '../di/token';
import type { AbpNavItem } from '../models/nav';

/** How siblings are ordered in every ABP tree. By `order`, unless the host says otherwise. */
export const NAV_COMPARE_FN = defineToken<(a: AbpNavItem, b: AbpNavItem) => number>(
  'NAV_COMPARE_FN',
  { factory: () => (a, b) => (a.order ?? 0) - (b.order ?? 0) },
);
