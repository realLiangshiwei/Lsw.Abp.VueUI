// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, type Component } from 'vue';
import { provideAppInitErrorHandler, provideAppInitializer } from './app-initializer';
import { InjectorDestroyedError, OutsideInjectionContextError } from './errors';
import { ABP_INJECTOR_KEY, inject } from './inject';
import { createInjector, onServiceDestroy, type Injector } from './injector';
import { defineToken } from './token';
import { createAbpApp, provideAbp } from './vue-bridge';

const Greeting = defineToken<string>('Greeting');

const Leaf = defineComponent({
  name: 'GreetingLeaf',
  setup() {
    const text = inject(Greeting);
    return () => h('span', text);
  },
});

/** `core` may not touch `document` (SSR rule), so borrow an element from test-utils. */
function hostElement(): Element {
  return mount(defineComponent({ name: 'HostElement', render: () => h('div') })).element;
}

function mountWith(injector: Injector, component: Component) {
  return mount(component, { global: { provide: { [ABP_INJECTOR_KEY]: injector } } });
}

describe('injection inside the component tree', () => {
  it('a component injects from the root injector of the application', async () => {
    const host = hostElement();
    const app = await createAbpApp(Leaf, {
      providers: [{ provide: Greeting, useValue: 'root' }],
    });

    app.mount(host);

    expect(host.textContent).toBe('root');
  });

  it('a page overrides the root with provideAbp and its children follow', () => {
    const Page = defineComponent({
      name: 'OverridingPage',
      setup() {
        provideAbp([{ provide: Greeting, useValue: 'page' }]);
        return () => h(Leaf);
      },
    });
    const root = createInjector([{ provide: Greeting, useValue: 'root' }]);

    expect(mountWith(root, Page).text()).toBe('page');
  });

  it('overrides nest, each level getting its own', () => {
    const Child = defineComponent({
      name: 'OverridingChild',
      setup() {
        provideAbp([{ provide: Greeting, useValue: 'child' }]);
        return () => h(Leaf);
      },
    });
    const Page = defineComponent({
      name: 'OverridingPageWithChild',
      setup() {
        provideAbp([{ provide: Greeting, useValue: 'page' }]);
        return () => h('div', [h(Leaf), h(Child)]);
      },
    });
    const root = createInjector([{ provide: Greeting, useValue: 'root' }]);

    expect(mountWith(root, Page).text()).toBe('pagechild');
  });

  it('an override applies to the component that made it', () => {
    const Page = defineComponent({
      name: 'SelfOverridingPage',
      setup() {
        provideAbp([{ provide: Greeting, useValue: 'page' }]);
        const text = inject(Greeting);
        return () => h('span', text);
      },
    });
    const root = createInjector([{ provide: Greeting, useValue: 'root' }]);

    expect(mountWith(root, Page).text()).toBe('page');
  });

  it('a service of a component level is cleaned up when the component unmounts', () => {
    const cleanup = vi.fn();
    const Scoped = defineToken<object>('Scoped');
    const Page = defineComponent({
      name: 'ScopedPage',
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
        return () => h('div');
      },
    });

    const wrapper = mountWith(createInjector([]), Page);
    expect(cleanup).not.toHaveBeenCalled();

    wrapper.unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('a callback reaches services through the injector it closed over, whenever it runs', async () => {
    let fromCallback: string | null = null;
    const Page = defineComponent({
      name: 'CallbackPage',
      setup() {
        const injector = provideAbp([{ provide: Greeting, useValue: 'page' }]);
        const onClick = () => {
          fromCallback = injector.get(Greeting);
        };
        return () => h('button', { onClick }, 'go');
      },
    });

    const wrapper = mountWith(createInjector([]), Page);
    await wrapper.find('button').trigger('click');

    expect(fromCallback).toBe('page');
  });

  it('provideAbp may only be called inside setup', () => {
    expect(() => provideAbp([])).toThrow(OutsideInjectionContextError);
  });
});

describe('createAbpApp', () => {
  it('initializers run in registration order, and only then does it mount', async () => {
    const order: string[] = [];
    const Root = defineComponent({
      name: 'InitRoot',
      setup() {
        order.push('mount');
        return () => h('div');
      },
    });

    const app = await createAbpApp(Root, {
      providers: [
        provideAppInitializer(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          order.push('slow');
        }),
        provideAppInitializer(() => {
          order.push('fast');
        }),
      ],
    });

    expect(order).toEqual(['slow', 'fast']);

    app.mount(hostElement());

    expect(order).toEqual(['slow', 'fast', 'mount']);
  });

  it('an initializer can inject services', async () => {
    let seen: string | null = null;
    const Root = defineComponent({ name: 'PlainRoot', render: () => h('div') });

    await createAbpApp(Root, {
      providers: [
        { provide: Greeting, useValue: 'root' },
        provideAppInitializer(() => {
          seen = inject(Greeting);
        }),
      ],
    });

    expect(seen).toBe('root');
  });

  it('the setup hook gets the app and the injector before the initializers run', async () => {
    const order: string[] = [];
    const Root = defineComponent({ name: 'SetupRoot', render: () => h('div') });

    const app = await createAbpApp(Root, {
      providers: [
        { provide: Greeting, useValue: 'root' },
        provideAppInitializer(() => {
          order.push('initializer');
        }),
      ],
      setup: (_app, injector) => {
        order.push(`setup:${injector.get(Greeting)}`);
      },
    });

    expect(order).toEqual(['setup:root', 'initializer']);
    expect(app.injector.get(Greeting)).toBe('root');
  });

  it('the root injector is destroyed with the application', async () => {
    const Root = defineComponent({ name: 'UnmountRoot', render: () => h('div') });
    const app = await createAbpApp(Root, {
      providers: [{ provide: Greeting, useValue: 'root' }],
    });
    app.mount(hostElement());

    app.app.unmount();

    expect(() => app.injector.get(Greeting)).toThrow(InjectorDestroyedError);
  });
});

describe('a failed startup', () => {
  it('with nobody handling it, a failed startup is a failed startup', async () => {
    const Root = defineComponent({ name: 'FailingRoot', render: () => h('div') });

    await expect(
      createAbpApp(Root, {
        providers: [
          provideAppInitializer(() => {
            throw new Error('backend is down');
          }),
        ],
      }),
    ).rejects.toThrow('backend is down');
  });

  it('startup continues when a handler is registered, and the later initializers still run', async () => {
    const Root = defineComponent({ name: 'RecoveringRoot', render: () => h('div') });
    const seen = vi.fn();
    const later = vi.fn();

    const app = await createAbpApp(Root, {
      providers: [
        provideAppInitErrorHandler(seen),
        provideAppInitializer(() => {
          throw new Error('backend is down');
        }),
        provideAppInitializer(later),
      ],
    });

    expect(seen).toHaveBeenCalledOnce();
    expect(later).toHaveBeenCalledOnce();
    expect(app.injector).toBeDefined();
  });
});
