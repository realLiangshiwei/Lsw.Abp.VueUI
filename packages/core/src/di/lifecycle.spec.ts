// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, KeepAlive, ref, Suspense } from 'vue';
import { ABP_INJECTOR_KEY, inject } from './inject.js';
import { createInjector, onServiceDestroy, type Injector } from './injector.js';
import { defineToken } from './token.js';
import { provideAbp } from './vue-bridge.js';

const Greeting = defineToken<string>('Greeting');

const mountWith = (injector: Injector, component: Parameters<typeof mount>[0]) =>
  mount(component, { global: { provide: { [ABP_INJECTOR_KEY]: injector } } });

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * V2 of the milestone: what happens to a component-level injector under the two Vue
 * features that do not simply mount and unmount a component.
 */
describe('the lifetime of a component-level injector', () => {
  it('an async setup under Suspense builds one injector', async () => {
    const built = vi.fn();
    const Page = defineComponent({
      name: 'AsyncPage',
      async setup() {
        // Before the first await, like everywhere else: after it, the component is no
        // longer "being set up" and neither provideAbp nor inject can find anything.
        provideAbp([
          {
            provide: Greeting,
            useFactory: () => {
              built();
              return 'page';
            },
          },
        ]);
        const text = inject(Greeting);

        await Promise.resolve();

        return () => h('span', text);
      },
    });

    const wrapper = mountWith(createInjector([{ provide: Greeting, useValue: 'root' }]), {
      name: 'SuspenseHost',
      render: () => h(Suspense, null, { default: () => h(Page) }),
    });
    await flush();

    expect(wrapper.text()).toBe('page');
    expect(built).toHaveBeenCalledOnce();
  });

  it('reaching a service after an await in an async setup needs the injector captured first', async () => {
    const Page = defineComponent({
      name: 'CapturingPage',
      async setup() {
        const injector = provideAbp([{ provide: Greeting, useValue: 'page' }]);
        await Promise.resolve();
        // inject() would be outside the context by now; the injector is not.
        return () => h('span', injector.get(Greeting));
      },
    });

    const wrapper = mountWith(createInjector([]), {
      name: 'CapturingHost',
      render: () => h(Suspense, null, { default: () => h(Page) }),
    });
    await flush();

    expect(wrapper.text()).toBe('page');
  });

  it('keep-alive deactivating a component keeps its injector; unmounting destroys it', async () => {
    const cleanup = vi.fn();
    const Scoped = defineToken<object>('Scoped');
    const Page = defineComponent({
      name: 'CachedPage',
      setup() {
        const injector = provideAbp([
          {
            provide: Scoped,
            useFactory: () => {
              onServiceDestroy(cleanup);
              return {};
            },
          },
        ]);
        injector.get(Scoped);
        return () => h('span', 'page');
      },
    });

    const shown = ref(true);
    const wrapper = mountWith(createInjector([]), {
      name: 'KeepAliveHost',
      render: () => h(KeepAlive, null, { default: () => (shown.value ? h(Page) : null) }),
    });

    shown.value = false;
    await wrapper.vm.$nextTick();
    expect(cleanup).not.toHaveBeenCalled();

    wrapper.unmount();

    expect(cleanup).toHaveBeenCalledOnce();
  });
});
