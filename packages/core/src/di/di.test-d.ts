import { describe, expectTypeOf, it } from 'vitest';
import { inject } from './inject.js';
import { createInjector } from './injector.js';
import type { Provider } from './provider.js';
import { defineService, defineToken, type ServiceOf } from './token.js';

interface Greeter {
  say(name: string): string;
}

const Greeting = defineToken<string>('Greeting');
const Greeters = defineToken<Greeter[]>('Greeters', { multi: true });
const GreeterService = defineService('GreeterService', () => ({
  say: (name: string) => `hei ${name}`,
}));
type GreeterService = ServiceOf<typeof GreeterService>;

describe('token', () => {
  it('defineService infers the service type from the factory', () => {
    expectTypeOf<GreeterService>().toEqualTypeOf<{ say: (name: string) => string }>();
    expectTypeOf(createInjector([]).get(GreeterService)).toEqualTypeOf<GreeterService>();
  });
});

describe('inject', () => {
  it('gives the type of the token', () => {
    expectTypeOf(inject(Greeting)).toEqualTypeOf<string>();
  });

  it('optional widens the result with null', () => {
    expectTypeOf(inject(Greeting, { optional: true })).toEqualTypeOf<string | null>();
  });
});

describe('injector.get', () => {
  const injector = createInjector([]);

  it('without a fallback value it always resolves', () => {
    expectTypeOf(injector.get(Greeting)).toEqualTypeOf<string>();
  });

  it('the type of the fallback value reaches the result', () => {
    expectTypeOf(injector.get(Greeting, null)).toEqualTypeOf<string | null>();
    expectTypeOf(injector.get(Greeters, [])).toEqualTypeOf<Greeter[] | never[]>();
  });
});

describe('provider', () => {
  it('useValue has to be the type of the token', () => {
    const right: Provider<string> = { provide: Greeting, useValue: 'hei' };
    void right;

    // @ts-expect-error the value does not match the type of the token
    const wrong: Provider<string> = { provide: Greeting, useValue: 42 };
    void wrong;
  });

  it('a multi provider contributes one element, not the whole array', () => {
    const one: Provider<Greeter[]> = {
      provide: Greeters,
      multi: true,
      useValue: { say: name => name },
    };
    void one;

    // @ts-expect-error the whole array is not one element
    const whole: Provider<Greeter[]> = { provide: Greeters, multi: true, useValue: [] };
    void whole;
  });

  it('every concrete kind of provider fits in the same array', () => {
    expectTypeOf<
      [
        { provide: typeof Greeting; useValue: string },
        { provide: typeof Greeters; multi: true; useFactory: () => Greeter },
      ]
    >().toExtend<Provider[]>();
  });
});
