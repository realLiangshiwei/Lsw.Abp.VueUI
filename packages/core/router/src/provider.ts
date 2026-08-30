import {
  collectFeatures,
  defineFeature,
  inject,
  makeEnvironmentProviders,
  provideAppSetup,
  RoutesService,
  runInInjectionContext,
  type EnvironmentProviders,
  type Feature,
  type InjectionToken,
  type Injector,
} from '@lsw-abpvue/core';
import {
  createRouter,
  createWebHistory,
  type NavigationGuard,
  type RouteRecordRaw,
  type Router,
  type RouterHistory,
} from 'vue-router';
import { authGuard, permissionGuard } from './guards';
import { registerRoutes } from './routes-handler';
import { TITLE_STRATEGY } from './title-strategy';
import { ABP_ROUTER, ROUTER_HISTORY, type TitleStrategy } from './tokens';

export type RouterFeature = Feature<'withRouterHistory' | 'withTitleStrategy'>;

/**
 * Guards run before their first `await`, so they need the context established for them.
 * Two parameters, not three: vue-router treats a three-parameter guard as one that will
 * call `next()` and stops waiting for its return value.
 */
function inContextOf(injector: Injector, guard: NavigationGuard): NavigationGuard {
  return (to, from) => runInInjectionContext(injector, () => guard(to, from, () => {}));
}

/**
 * Creates the router, wires ABP's guards to it and feeds the menu from the routes'
 * `meta.routes`.
 *
 * The router is installed after the app initializers rather than while providers are
 * being collected, so its first navigation sees a loaded configuration -- a permission
 * guard running before the user is known would turn every route into a redirect.
 * @param routes The application's routes
 * @param features `withXxx()` results
 */
export function provideAbpRouter(
  routes: RouteRecordRaw[],
  ...features: RouterFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ROUTER_HISTORY, useFactory: (): RouterHistory => createWebHistory() },
    {
      provide: ABP_ROUTER,
      useFactory: (): Router => createRouter({ history: inject(ROUTER_HISTORY), routes }),
    },
    provideAppSetup(async (app, injector) => {
      const router = injector.get(ABP_ROUTER);
      const titleStrategy = injector.get(TITLE_STRATEGY);

      router.beforeEach(inContextOf(injector, authGuard));
      router.beforeEach(inContextOf(injector, permissionGuard));
      router.afterEach(to => titleStrategy.setTitle(to.meta.title));

      app.use(router);
      registerRoutes(router, injector.get(RoutesService));

      // A first navigation that a guard turns down is not a reason to refuse to start.
      await router.isReady().catch(() => undefined);
    }),
    ...collectFeatures('provideAbpRouter()', features),
  ]);
}

/** Hash routing, for a backend that cannot be told about client-side URLs. */
export function withRouterHistory(history: RouterHistory): RouterFeature {
  return defineFeature('withRouterHistory', [{ provide: ROUTER_HISTORY, useValue: history }]);
}

/**
 * Replaces how the document title is built.
 * @param strategy Token of the replacement, so it can inject what it needs
 */
export function withTitleStrategy(strategy: InjectionToken<TitleStrategy>): RouterFeature {
  return defineFeature('withTitleStrategy', [{ provide: TITLE_STRATEGY, useExisting: strategy }]);
}

/** The router of the running application; `useRouter()` from vue-router also works. */
export const useAbpRouter = (): Router => inject(ABP_ROUTER);
