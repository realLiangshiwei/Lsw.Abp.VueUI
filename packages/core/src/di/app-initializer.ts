import { runInInjectionContext } from './inject.js';
import type { Injector } from './injector.js';
import type { Provider } from './provider.js';
import { defineToken } from './token.js';

/** Runs once during startup, before the application is mounted. */
export type AppInitializer = () => void | Promise<void>;

/** Gets a chance to explain a failed startup instead of leaving a blank page. */
export type AppInitErrorHandler = (error: unknown) => void;

export const APP_INITIALIZERS = defineToken<AppInitializer[]>('APP_INITIALIZERS', {
  multi: true,
  hint: 'Register one with provideAppInitializer(fn).',
});

export const APP_INIT_ERROR_HANDLERS = defineToken<AppInitErrorHandler[]>(
  'APP_INIT_ERROR_HANDLERS',
  { multi: true },
);

/**
 * Registers a handler for a failed initializer. With one registered, startup carries on
 * and the application mounts with whatever state it has -- which is how an unreachable
 * backend becomes a message on screen instead of nothing at all. Without one, the
 * failure stops the application from starting.
 * @param fn Receives the error the initializer threw
 */
export function provideAppInitErrorHandler(
  fn: AppInitErrorHandler,
): Provider<AppInitErrorHandler[]> {
  return { provide: APP_INIT_ERROR_HANDLERS, multi: true, useValue: fn };
}

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
  const onError = injector.get(APP_INIT_ERROR_HANDLERS, [], { optional: true });

  for (const initializer of initializers) {
    try {
      await runInInjectionContext(injector, initializer);
    } catch (error) {
      if (onError.length === 0) throw error;
      // One initializer failing is not a reason to skip the rest: the theme still has to
      // be set up for the error to be shown in.
      for (const handle of onError) handle(error);
    }
  }
}
