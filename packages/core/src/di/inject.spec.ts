import { describe, expect, it } from 'vitest';
import { OutsideInjectionContextError } from './errors';
import { getCurrentInjector, inject, runInInjectionContext } from './inject';
import { createInjector } from './injector';
import { defineService, defineToken } from './token';

const Greeting = defineToken<string>('Greeting');

describe('inject', () => {
  it('a service factory reaches the other services of the same injector', () => {
    const Greeter = defineService('Greeter', () => ({ text: inject(Greeting) }));
    const injector = createInjector([{ provide: Greeting, useValue: 'hei' }]);

    expect(injector.get(Greeter).text).toBe('hei');
  });

  it('calling outside an injection context says where it can be called', () => {
    expect(() => inject(Greeting)).toThrow(OutsideInjectionContextError);
    expect(() => inject(Greeting)).toThrow(/inject\(Greeting\) was called outside/);
  });

  it('the context is gone after an await', async () => {
    const injector = createInjector([{ provide: Greeting, useValue: 'hei' }]);

    const afterAwait = injector.runInContext(async () => {
      await Promise.resolve();
      // eslint-disable-next-line abp/no-inject-after-await -- the point of the test
      return inject(Greeting);
    });

    await expect(afterAwait).rejects.toThrow(OutsideInjectionContextError);
  });

  it('capturing the injector first survives an await', async () => {
    const injector = createInjector([{ provide: Greeting, useValue: 'hei' }]);

    const afterAwait = injector.runInContext(async () => {
      const captured = getCurrentInjector();
      await Promise.resolve();
      return captured?.get(Greeting);
    });

    await expect(afterAwait).resolves.toBe('hei');
  });

  it('optional returns null when nothing provides it', () => {
    const injector = createInjector([]);

    expect(injector.runInContext(() => inject(Greeting, { optional: true }))).toBeNull();
  });

  it('leaving a nested context goes back to the outer one', () => {
    const outer = createInjector([]);
    const inner = createInjector([], outer);

    runInInjectionContext(outer, () => {
      runInInjectionContext(inner, () => {
        expect(getCurrentInjector()).toBe(inner);
      });
      expect(getCurrentInjector()).toBe(outer);
    });

    expect(getCurrentInjector()).toBeNull();
  });

  it('a throw inside the context does not leave it on the stack', () => {
    const injector = createInjector([]);

    expect(() =>
      injector.runInContext(() => {
        throw new Error('boom');
      }),
    ).toThrow('boom');
    expect(getCurrentInjector()).toBeNull();
  });
});
