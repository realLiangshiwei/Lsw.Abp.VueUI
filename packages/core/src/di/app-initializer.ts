import { runInInjectionContext } from './inject';
import type { Injector } from './injector';
import type { Provider } from './provider';
import { defineToken } from './token';

/** Runs once during startup, before the application is mounted. */
export type AppInitializer = () => void | Promise<void>;

export const APP_INITIALIZERS = defineToken<AppInitializer[]>('APP_INITIALIZERS', {
  multi: true,
  hint: 'Register one with provideAppInitializer(fn).',
});

/**
 * Registers work that has to finish before the application mounts — reading the tenant
 * from the URL, restoring a session, fetching the application configuration.
 * @param fn Initializer; may `inject()` and may return a promise
 */
export function provideAppInitializer(fn: AppInitializer): Provider<AppInitializer[]> {
  return { provide: APP_INITIALIZERS, multi: true, useValue: fn };
}

/**
 * Runs the registered initializers one after another. Serial on purpose: the order they
 * were registered in is meaningful (tenant, then authentication, then configuration).
 */
export async function runInitializers(injector: Injector): Promise<void> {
  const initializers = injector.get(APP_INITIALIZERS, [], { optional: true });

  for (const initializer of initializers) {
    await runInInjectionContext(injector, initializer);
  }
}
