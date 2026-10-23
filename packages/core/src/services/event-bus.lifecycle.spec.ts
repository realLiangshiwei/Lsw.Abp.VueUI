// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { expect, it, vi } from 'vitest';
import { ABP_INJECTOR_KEY, inject } from '../di/inject.js';
import { createInjector, onServiceDestroy } from '../di/injector.js';
import { defineService } from '../di/token.js';
import { createAbpApp } from '../di/vue-bridge.js';
import { defineEvent } from '../utils/define-event.js';
import { useSubscriptions } from '../utils/use-subscriptions.js';
import { EventBusService, useEventBus } from './event-bus.service.js';
import { DocumentService } from './platform/document.service.js';

it('unsubscribes components and services without disposing the shared bus', () => {
  const changed = defineEvent<void>('Test.Changed');
  const componentSeen = vi.fn();
  const serviceSeen = vi.fn();
  const root = createInjector([]);
  const bus = root.get(EventBusService);
  const Component = defineComponent({
    setup() {
      useSubscriptions().add(useEventBus().on(changed, componentSeen));
      return () => h('span', 'listener');
    },
  });
  const Observer = defineService('Observer', () => ({ init: () => {} }));
  const child = createInjector(
    [
      {
        provide: Observer,
        useFactory: () => {
          const events = inject(EventBusService);
          let stop: (() => void) | undefined;
          onServiceDestroy(() => stop?.());
          return {
            init: () => {
              stop ??= events.on(changed, serviceSeen);
            },
          };
        },
      },
    ],
    root,
  );
  const observer = child.get(Observer);
  observer.init();
  const wrapper = mount(Component, { global: { provide: { [ABP_INJECTOR_KEY]: root } } });
  try {
    bus.emit(changed, undefined);
    wrapper.unmount();
    child.destroy();
    bus.emit(changed, undefined);
    expect(componentSeen).toHaveBeenCalledOnce();
    expect(serviceSeen).toHaveBeenCalledOnce();
  } finally {
    wrapper.unmount();
    child.destroy();
    root.destroy();
  }
});

it('disposes the event bus when its Vue application unmounts', async () => {
  const changed = defineEvent<void>('Test.Changed');
  const seen = vi.fn();
  const app = await createAbpApp(defineComponent({ render: () => h('div') }), { providers: [] });
  const bus = app.injector.get(EventBusService);
  bus.on(changed, seen);
  const target = app.injector.get(DocumentService).nativeDocument?.createElement('div');
  expect(target).toBeDefined();
  if (!target) return;
  app.app.mount(target);
  app.app.unmount();
  bus.emit(changed, undefined);
  expect(seen).not.toHaveBeenCalled();
});
