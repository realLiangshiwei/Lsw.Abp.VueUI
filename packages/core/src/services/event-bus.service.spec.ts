import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInjector, type Injector } from '../di/injector.js';
import { EventHandlerError } from '../models/events.js';
import { EVENT_BUS_ERROR_HANDLER } from '../tokens/event-bus.token.js';
import { defineEvent } from '../utils/define-event.js';
import { useSubscriptions } from '../utils/use-subscriptions.js';
import { EventBusService, useEventBus } from './event-bus.service.js';

const Changed = defineEvent<{ id: string }>('Test.Changed');
const injectors: Injector[] = [];

function createBus(report = vi.fn()) {
  const injector = createInjector([{ provide: EVENT_BUS_ERROR_HANDLER, useValue: report }]);
  injectors.push(injector);
  return { injector, bus: injector.get(EventBusService), report };
}

afterEach(() => {
  for (const injector of injectors.splice(0)) injector.destroy();
  vi.restoreAllMocks();
});

describe('EventBusService', () => {
  it('delivers synchronously in subscription order and accepts no subscribers', () => {
    const { bus } = createBus();
    const seen: string[] = [];
    bus.emit(Changed, { id: 'before' });
    bus.on(Changed, payload => {
      seen.push(`first:${payload.id}`);
    });
    bus.on(Changed, payload => {
      seen.push(`second:${payload.id}`);
    });

    expect(bus.emit(Changed, { id: 'one' })).toBeUndefined();
    expect(seen).toEqual(['first:one', 'second:one']);
  });

  it('keeps equally named event identities separate and does not replay', () => {
    const { bus } = createBus();
    const other = defineEvent<{ id: string }>('Test.Changed');
    const seen = vi.fn();
    bus.emit(Changed, { id: 'before' });
    bus.on(Changed, seen);
    bus.emit(other, { id: 'other' });

    expect(seen).not.toHaveBeenCalled();
    bus.emit(Changed, { id: 'after' });
    expect(seen).toHaveBeenCalledExactlyOnceWith({ id: 'after' });
  });

  it('unsubscribes independent registrations idempotently', () => {
    const { bus } = createBus();
    const seen = vi.fn();
    const stop = bus.on(Changed, seen);
    const stopOther = bus.on(Changed, seen);
    stop();
    stop();
    bus.emit(Changed, { id: 'one' });
    expect(seen).toHaveBeenCalledOnce();
    stopOther();
    const last = bus.on(Changed, seen);
    stop();
    bus.emit(Changed, { id: 'two' });
    expect(seen).toHaveBeenCalledTimes(2);
    last();
    bus.emit(Changed, { id: 'three' });
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it('defers new subscriptions and skips listeners removed during dispatch', () => {
    const { bus } = createBus();
    const seen: string[] = [];
    let stopSecond = () => {};
    let added = false;
    bus.on(Changed, () => {
      seen.push('first');
      stopSecond();
      if (!added) {
        added = true;
        bus.on(Changed, () => {
          seen.push('new');
        });
      }
    });
    stopSecond = bus.on(Changed, () => {
      seen.push('removed');
    });
    bus.emit(Changed, { id: 'one' });
    expect(seen).toEqual(['first']);
    bus.emit(Changed, { id: 'two' });
    expect(seen).toEqual(['first', 'first', 'new']);
  });

  it('reports synchronous and asynchronous failures without interrupting consumers', async () => {
    const { bus, report } = createBus();
    const synchronous = new TypeError('synchronous failure');
    const asynchronous = new TypeError('asynchronous failure');
    const seen = vi.fn();
    bus.on(Changed, () => {
      throw synchronous;
    });
    bus.on(Changed, async () => {
      throw asynchronous;
    });
    bus.on(Changed, seen);

    expect(() => bus.emit(Changed, { id: 'one' })).not.toThrow();
    expect(seen).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(report).toHaveBeenCalledTimes(2);
    for (const cause of [synchronous, asynchronous])
      expect(report).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'EventHandlerError',
          eventDescription: Changed.description,
          cause,
        }),
      );
    expect(report.mock.calls[0]?.[0]).toBeInstanceOf(EventHandlerError);
  });

  it('does not wait for asynchronous listeners', async () => {
    const { bus } = createBus();
    let finish = () => {};
    const pending = new Promise<void>(resolve => {
      finish = resolve;
    });
    const seen = vi.fn();
    bus.on(Changed, () => pending);
    bus.on(Changed, seen);
    bus.emit(Changed, { id: 'one' });
    expect(seen).toHaveBeenCalledOnce();
    finish();
    await pending;
  });

  it('falls back to diagnostics if a custom error reporter fails', async () => {
    const diagnostics = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reportingFailure = new TypeError('reporting failure');
    const report = vi.fn();
    report.mockImplementationOnce(() => {
      throw reportingFailure;
    });
    report.mockImplementationOnce(async () => {
      throw reportingFailure;
    });
    const { bus } = createBus(report);
    bus.on(Changed, () => {
      throw new TypeError('listener failure');
    });
    bus.emit(Changed, { id: 'one' });
    bus.emit(Changed, { id: 'two' });
    await Promise.resolve();
    expect(diagnostics).toHaveBeenCalledTimes(2);
    expect(diagnostics).toHaveBeenCalledWith(reportingFailure, expect.any(EventHandlerError));
  });

  it('reports failures to the default diagnostic handler', () => {
    const diagnostics = vi.spyOn(console, 'error').mockImplementation(() => {});
    const injector = createInjector([]);
    injectors.push(injector);
    const bus = injector.get(EventBusService);
    bus.on(Changed, () => {
      throw new TypeError('listener failure');
    });
    bus.emit(Changed, { id: 'one' });
    expect(diagnostics).toHaveBeenCalledExactlyOnceWith(expect.any(EventHandlerError));
  });

  it('shares the root instance with children and isolates independent applications', () => {
    const first = createBus();
    const second = createBus();
    const child = createInjector([], first.injector);
    injectors.push(child);
    const seen = vi.fn();
    first.bus.on(Changed, seen);
    expect(child.get(EventBusService)).toBe(first.bus);
    expect(first.injector.runInContext(useEventBus)).toBe(first.bus);
    second.bus.emit(Changed, { id: 'other' });
    expect(seen).not.toHaveBeenCalled();
  });

  it('disposes scoped subscriptions and stops retained references after destruction', () => {
    const { bus, injector } = createBus();
    const seen = vi.fn();
    const scope = effectScope();
    scope.run(() => useSubscriptions().add(bus.on(Changed, seen)));
    bus.emit(Changed, { id: 'one' });
    scope.stop();
    bus.emit(Changed, { id: 'two' });
    expect(seen).toHaveBeenCalledOnce();
    bus.on(Changed, seen);
    injector.destroy();
    bus.on(Changed, seen)();
    bus.emit(Changed, { id: 'three' });
    expect(seen).toHaveBeenCalledOnce();
  });

  it('stops the current dispatch when its application is destroyed', () => {
    const { bus, injector } = createBus();
    const seen = vi.fn();
    bus.on(Changed, () => injector.destroy());
    bus.on(Changed, seen);
    bus.emit(Changed, { id: 'one' });
    expect(seen).not.toHaveBeenCalled();
  });
});
