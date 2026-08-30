/**
 * Everything that needs vue-router. Kept out of the main entry so an application that
 * does not route -- or a package that only reads configuration -- never loads it.
 *
 * The main entry is imported by package name rather than by relative path: this entry is
 * built and typed on its own, and reaching into `../../src` would pull the whole main
 * entry into its declarations (design 03 §2).
 */
import './route-meta';

export { default as AbpDynamicLayout } from './components/AbpDynamicLayout.vue';
export { default as AbpReplaceableRouteContainer } from './components/AbpReplaceableRouteContainer.vue';
export { authGuard, permissionGuard, withResolvers } from './guards';
export { lazyRoutes } from './lazy-routes';
export { provideAbpRouter, useAbpRouter, withRouterHistory, withTitleStrategy } from './provider';
export { collectRoutes, registerRoutes } from './routes-handler';
export { TITLE_STRATEGY } from './title-strategy';
export { ABP_ROUTER, DYNAMIC_LAYOUTS, ROUTER_HISTORY } from './tokens';
export type { ReplaceableRoute, TitleStrategy } from './tokens';
