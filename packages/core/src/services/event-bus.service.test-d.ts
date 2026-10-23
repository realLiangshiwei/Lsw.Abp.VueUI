import { expectTypeOf, test } from 'vitest';
import { createInjector } from '../di/injector.js';
import type { EventBus, EventToken } from '../models/events.js';
import { defineEvent } from '../utils/define-event.js';
import { EventBusService } from './event-bus.service.js';
import type { useEventBus } from './event-bus.service.js';

test('infers payloads only from the event contract', () => {
  const changed = defineEvent<{ id: string }>('Test.Changed');
  const count = defineEvent<number>('Test.Count');
  const bus = createInjector([]).get(EventBusService);
  expectTypeOf(changed).toEqualTypeOf<EventToken<{ id: string }>>();
  expectTypeOf(bus).toEqualTypeOf<EventBus>();
  expectTypeOf<ReturnType<typeof useEventBus>>().toEqualTypeOf<EventBus>();
  expectTypeOf(
    bus.on(changed, payload => {
      expectTypeOf(payload).toEqualTypeOf<{ id: string }>();
    }),
  ).toEqualTypeOf<() => void>();
  expectTypeOf(bus.emit(changed, { id: 'one' })).toEqualTypeOf<void>();
  bus.on(changed, async () => {});
  // @ts-expect-error The event token determines the payload type.
  bus.emit(changed, { id: 1 });
  // @ts-expect-error Payload inference cannot widen the token contract.
  bus.emit(count, 'one');
  // @ts-expect-error A listener must accept the declared event payload.
  bus.on(changed, (payload: { id: number }) => {
    void payload;
  });
  // @ts-expect-error Event descriptions do not identify events.
  bus.emit('Test.Changed', { id: 'one' });
});
