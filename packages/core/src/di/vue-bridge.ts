import {
  createApp,
  getCurrentInstance,
  onScopeDispose,
  provide as vueProvide,
  type App,
  type Component,
} from 'vue';
import { runInitializers } from './app-initializer';
import { OutsideInjectionContextError } from './errors';
import { ABP_INJECTOR_KEY, getCurrentInjector, setComponentInjector } from './inject';
import { createInjector, type Injector } from './injector';
import type { ProviderInput } from './provider';

/**
 * Adds an injector for this component and everything below it, overriding what the
 * application provides. Call it synchronously in `<script setup>`; the injector is
 * destroyed with the component.
 * @param providers Providers of the component-level injector
 * @returns The new injector, for callbacks that need it outside a setup context
 */
export function provideAbp(providers: readonly ProviderInput[]): Injector {
  const instance = getCurrentInstance();
  if (!instance) throw new OutsideInjectionContextError('provideAbp()');

  const child = createInjector(providers, getCurrentInjector());

  vueProvide(ABP_INJECTOR_KEY, child);
  setComponentInjector(instance, child);
  onScopeDispose(() => child.destroy(), true);

  return child;
}

export interface CreateAbpAppOptions {
  providers: readonly ProviderInput[];
  /** Runs after the injector exists and before the initializers, to `app.use()` plugins. */
  setup?: ((app: App, injector: Injector) => void | Promise<void>) | undefined;
}

export interface AbpApp {
  app: App;
  injector: Injector;
  mount(target: string | Element): void;
}

/**
 * Creates the Vue application and its root injector, then runs the app initializers.
 * Mirrors Angular's `bootstrapApplication` plus `ApplicationConfig`.
 * @param rootComponent Component to mount
 * @param options Providers of the root injector and an optional setup hook
 * @see https://angular.dev/api/platform-browser/bootstrapApplication
 */
export async function createAbpApp(
  rootComponent: Component,
  options: CreateAbpAppOptions,
): Promise<AbpApp> {
  const app = createApp(rootComponent);
  const injector = createInjector(options.providers, null);
  app.provide(ABP_INJECTOR_KEY, injector);

  // Services own timers and listeners, so the injector has to go down with the app it
  // was built for — otherwise a remount (tests, HMR) leaves the old one running.
  const unmount = app.unmount.bind(app);
  app.unmount = () => {
    unmount();
    injector.destroy();
  };

  await options.setup?.(app, injector);
  await runInitializers(injector);

  return {
    app,
    injector,
    mount: target => {
      app.mount(target);
    },
  };
}
