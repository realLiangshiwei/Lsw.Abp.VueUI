/**
 * Everything that needs vue-router. Kept out of the main entry so an application that
 * does not route -- or a package that only reads configuration -- never loads it.
 *
 * The main entry is imported by package name rather than by relative path: this entry is
 * built and typed on its own, and reaching into `../../src` would pull the whole main
 * entry into its declarations (design 03 §2).
 */
import './route-meta.js';

export { default as AbpDynamicLayout } from './components/AbpDynamicLayout.vue';
export { default as AbpReplaceableRouteContainer } from './components/AbpReplaceableRouteContainer.vue';
export { authGuard, permissionGuard, withResolvers } from './guards.js';
export { lazyRoutes } from './lazy-routes.js';
export {
  provideAbpRouter,
  useAbpRouter,
  withRouterHistory,
  withTitleStrategy,
} from './provider.js';
export { collectRoutes, registerRoutes } from './routes-handler.js';
export { TITLE_STRATEGY } from './title-strategy.js';
export { ABP_ROUTER, DYNAMIC_LAYOUTS, FORBIDDEN_ROUTE, ROUTER_HISTORY } from './tokens.js';
export type { ReplaceableRoute, TitleStrategy } from './tokens.js';
