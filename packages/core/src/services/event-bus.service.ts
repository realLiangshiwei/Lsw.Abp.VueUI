import { inject } from '../di/inject.js';
import { onServiceDestroy } from '../di/injector.js';
import { defineService, type ServiceOf } from '../di/token.js';
import { EventHandlerError } from '../models/events.js';
import type { EventBus, EventHandler, EventToken } from '../models/events.js';
import { EVENT_BUS_ERROR_HANDLER } from '../tokens/event-bus.token.js';

export const EventBusService = defineService('EventBusService', (): EventBus => {
  const reportError = inject(EVENT_BUS_ERROR_HANDLER);
  const listeners = new Map<symbol, Set<EventHandler<unknown>>>();
  let destroyed = false;

  onServiceDestroy(() => {
    destroyed = true;
    for (const handlers of listeners.values()) handlers.clear();
    listeners.clear();
  });

  function report(description: string, cause: unknown): void {
    const error = new EventHandlerError(description, cause);
    try {
      const pending = reportError(error);
      if (pending) void Promise.resolve(pending).catch(failure => console.error(failure, error));
    } catch (failure) {
      console.error(failure, error);
    }
  }

  return {
    on<T>(event: EventToken<T>, handler: EventHandler<NoInfer<T>>): () => void {
      if (destroyed) return () => {};
      let handlers = listeners.get(event.key);
      if (!handlers) {
        handlers = new Set();
        listeners.set(event.key, handlers);
      }
      const subscription = handlers;
      const listener: EventHandler<unknown> = payload => handler(payload as T);
      subscription.add(listener);
      return () => {
        subscription.delete(listener);
        if (subscription.size === 0 && listeners.get(event.key) === subscription)
          listeners.delete(event.key);
      };
    },
    emit<T>(event: EventToken<T>, payload: NoInfer<T>): void {
      if (destroyed) return;
      const handlers = listeners.get(event.key);
      if (!handlers) return;
      for (const listener of [...handlers]) {
        if (destroyed) break;
        if (!handlers.has(listener)) continue;
        try {
          const pending = listener(payload);
          if (pending)
            void Promise.resolve(pending).catch(cause => report(event.description, cause));
        } catch (cause) {
          report(event.description, cause);
        }
      }
    },
  };
});
export type EventBusService = ServiceOf<typeof EventBusService>;

export const useEventBus = (): EventBusService => inject(EventBusService);
