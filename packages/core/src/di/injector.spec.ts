import { describe, expect, it, vi } from 'vitest';
import {
  CircularDependencyError,
  InjectorDestroyedError,
  InvalidProviderError,
  MultiProviderMismatchError,
  NullInjectorError,
  OutsideInjectionContextError,
} from './errors';
import { inject } from './inject';
import { createInjector, onServiceDestroy } from './injector';
import { makeEnvironmentProviders, type Provider } from './provider';
import { defineService, defineToken, type InjectionToken } from './token';

const Greeting = defineToken<string>('Greeting');
const Interceptors = defineToken<string[]>('Interceptors', { multi: true });

describe('the four kinds of provider', () => {
  it('useValue hands the value straight over', () => {
    expect(createInjector([{ provide: Greeting, useValue: 'hei' }]).get(Greeting)).toBe('hei');
  });

  it('useFactory is evaluated in the context of its own injector', () => {
    const Upper = defineToken<string>('Upper');
    const injector = createInjector([
      { provide: Greeting, useValue: 'hei' },
      { provide: Upper, useFactory: () => inject(Greeting).toUpperCase() },
    ]);

    expect(injector.get(Upper)).toBe('HEI');
  });

  it('useClass is instantiated in the context too', () => {
    const Speaker = defineToken<{ say(): string }>('Speaker');

    class LoudSpeaker {
      readonly #greeting = inject(Greeting);
      say() {
        return `${this.#greeting}!`;
      }
    }

    const injector = createInjector([
      { provide: Greeting, useValue: 'hei' },
      { provide: Speaker, useClass: LoudSpeaker },
    ]);

    expect(injector.get(Speaker).say()).toBe('hei!');
  });

  it('useExisting is an alias of another token', () => {
    const Alias = defineToken<string>('Alias');
    const injector = createInjector([
      { provide: Greeting, useValue: 'hei' },
      { provide: Alias, useExisting: Greeting },
    ]);

    expect(injector.get(Alias)).toBe('hei');
  });

  it('an alias to a token nobody provides is reported as missing', () => {
    const Alias = defineToken<string>('Alias');

    expect(() => createInjector([{ provide: Alias, useExisting: Greeting }]).get(Alias)).toThrow(
      NullInjectorError,
    );
  });

  it('a provider that says nothing is refused', () => {
    const broken = { provide: Greeting } as unknown as Provider;

    expect(() => createInjector([broken]).get(Greeting)).toThrow(InvalidProviderError);
  });

  it('a later provider for the same token replaces the earlier one', () => {
    const injector = createInjector([
      { provide: Greeting, useValue: 'first' },
      { provide: Greeting, useValue: 'second' },
    ]);

    expect(injector.get(Greeting)).toBe('second');
  });

  it('EnvironmentProviders are flattened, nested ones too', () => {
    const injector = createInjector([
      makeEnvironmentProviders([
        makeEnvironmentProviders([{ provide: Greeting, useValue: 'hei' }]),
      ]),
    ]);

    expect(injector.get(Greeting)).toBe('hei');
  });
});

describe('instantiation', () => {
  it('a service is built once', () => {
    const build = vi.fn(() => ({}));
    const Service = defineService('Service', build);
    const injector = createInjector([]);

    injector.get(Service);
    injector.get(Service);

    expect(build).toHaveBeenCalledTimes(1);
  });

  it('a service nobody injects is never built', () => {
    const build = vi.fn(() => ({}));
    defineService('Unused', build);

    createInjector([]);

    expect(build).not.toHaveBeenCalled();
  });

  it('a value of undefined counts as built and is not evaluated again', () => {
    const build = vi.fn(() => undefined);
    const Nothing = defineToken<undefined>('Nothing', { factory: build });
    const injector = createInjector([]);

    injector.get(Nothing);
    injector.get(Nothing);

    expect(build).toHaveBeenCalledTimes(1);
  });
});

describe('hierarchy', () => {
  it('a child level falls back to its parent', () => {
    const parent = createInjector([{ provide: Greeting, useValue: 'hei' }]);

    expect(createInjector([], parent).get(Greeting)).toBe('hei');
  });

  it('a provider in a child level hides the parent, which is itself untouched', () => {
    const parent = createInjector([{ provide: Greeting, useValue: 'hei' }]);
    const child = createInjector([{ provide: Greeting, useValue: 'moi' }], parent);

    expect(child.get(Greeting)).toBe('moi');
    expect(parent.get(Greeting)).toBe('hei');
  });

  it('a service with a default implementation is built once, at the root, whichever level asks', () => {
    const build = vi.fn(() => ({}));
    const Service = defineService('Service', build);
    const root = createInjector([]);
    const first = createInjector([], root);
    const second = createInjector([], createInjector([], root));

    expect(first.get(Service)).toBe(second.get(Service));
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('the factory of a root default is evaluated at the root and cannot see a child provider', () => {
    const Marker = defineToken<string>('Marker');
    const Service = defineService('Service', () => inject(Marker));
    const root = createInjector([{ provide: Marker, useValue: 'root' }]);
    const child = createInjector([{ provide: Marker, useValue: 'child' }], root);

    expect(child.get(Service)).toBe('root');
  });
});

describe('multi', () => {
  it('several providers at one level become an array in registration order', () => {
    const injector = createInjector([
      { provide: Interceptors, multi: true, useValue: 'auth' },
      { provide: Interceptors, multi: true, useValue: 'tenant' },
    ]);

    expect(injector.get(Interceptors)).toEqual(['auth', 'tenant']);
  });

  it('a child level adds to its parent rather than replacing it', () => {
    const parent = createInjector([{ provide: Interceptors, multi: true, useValue: 'auth' }]);
    const child = createInjector(
      [{ provide: Interceptors, multi: true, useValue: 'tenant' }],
      parent,
    );

    expect(child.get(Interceptors)).toEqual(['auth', 'tenant']);
    expect(parent.get(Interceptors)).toEqual(['auth']);
  });

  it('no provider at all is treated as missing', () => {
    expect(createInjector([]).get(Interceptors, [])).toEqual([]);
    expect(() => createInjector([]).get(Interceptors)).toThrow(NullInjectorError);
  });

  it('a plain provider on a multi token is refused', () => {
    expect(() =>
      createInjector([{ provide: Interceptors, useValue: ['auth'] }]).get(Interceptors),
    ).toThrow(MultiProviderMismatchError);
  });

  it('a multi provider on a plain token is refused too', () => {
    const provider = { provide: Greeting, multi: true, useValue: 'hei' } as unknown as Provider;

    expect(() => createInjector([provider])).toThrow(MultiProviderMismatchError);
  });
});

describe('when nothing provides it', () => {
  it('the error it throws carries the resolution path', () => {
    const Middle = defineService('Middle', () => inject(Greeting));
    const Outer = defineService('Outer', () => inject(Middle));

    expect(() => createInjector([]).get(Outer)).toThrow(
      /Resolution path: Outer → Middle → Greeting/,
    );
  });

  it('a fallback value is returned when it was given', () => {
    expect(createInjector([]).get(Greeting, 'fallback')).toBe('fallback');
  });

  it('a hint on the token replaces the generic advice', () => {
    const Auth = defineToken<string>('AuthService', {
      hint: 'Did you forget provideAbpOAuth()?',
    });

    expect(() => createInjector([]).get(Auth)).toThrow(/Did you forget provideAbpOAuth\(\)\?/);
  });
});

describe('circular dependencies', () => {
  it('two services injecting each other name the whole cycle', () => {
    const First: InjectionToken<unknown> = defineToken('First', { factory: () => inject(Second) });
    const Second: InjectionToken<unknown> = defineToken('Second', { factory: () => inject(First) });

    expect(() => createInjector([]).get(First)).toThrow(CircularDependencyError);
    expect(() => createInjector([]).get(First)).toThrow(/First → Second → First/);
  });

  it('the injector still works once a cycle has been refused', () => {
    const Loop: InjectionToken<unknown> = defineToken('Loop', { factory: () => inject(Loop) });
    const injector = createInjector([{ provide: Greeting, useValue: 'hei' }]);

    expect(() => injector.get(Loop)).toThrow(CircularDependencyError);
    expect(injector.get(Greeting)).toBe('hei');
  });
});

describe('destruction', () => {
  it('cleanup hooks run in reverse registration order', () => {
    const order: string[] = [];
    const First = defineService('First', () => {
      onServiceDestroy(() => order.push('first'));
      return {};
    });
    const Second = defineService('Second', () => {
      onServiceDestroy(() => order.push('second'));
      return {};
    });
    const injector = createInjector([]);

    injector.get(First);
    injector.get(Second);
    injector.destroy();

    expect(order).toEqual(['second', 'first']);
  });

  it('asking for a service after destruction says why it cannot be had', () => {
    const injector = createInjector([{ provide: Greeting, useValue: 'hei' }]);
    injector.destroy();

    expect(() => injector.get(Greeting)).toThrow(InjectorDestroyedError);
  });

  it('destroying twice runs the hooks once', () => {
    const hook = vi.fn();
    const Service = defineService('Service', () => {
      onServiceDestroy(hook);
      return {};
    });
    const injector = createInjector([]);
    injector.get(Service);

    injector.destroy();
    injector.destroy();

    expect(hook).toHaveBeenCalledTimes(1);
  });

  it('destroying a parent leaves an already built child instance alone', () => {
    const parent = createInjector([{ provide: Greeting, useValue: 'hei' }]);
    const child = createInjector([{ provide: Greeting, useValue: 'moi' }], parent);
    child.get(Greeting);

    parent.destroy();

    expect(child.get(Greeting)).toBe('moi');
  });

  it('onServiceDestroy may only be called inside a factory', () => {
    expect(() => onServiceDestroy(() => {})).toThrow(OutsideInjectionContextError);
  });
});
