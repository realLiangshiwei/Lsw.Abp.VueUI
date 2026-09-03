import { describe, expect, it } from 'vitest';
import { DuplicateFeatureError } from './errors.js';
import { collectFeatures, defineFeature } from './features.js';
import { createInjector } from './injector.js';
import { defineToken } from './token.js';

const Greeting = defineToken<string>('Greeting');
const Interceptors = defineToken<string[]>('Interceptors', { multi: true });

const withGreeting = (text: string) =>
  defineFeature('withGreeting', [{ provide: Greeting, useValue: text }]);

const withInterceptor = (name: string) =>
  defineFeature('withInterceptor', [{ provide: Interceptors, multi: true, useValue: name }], {
    repeatable: true,
  });

describe('collectFeatures', () => {
  it('flattens the providers of each feature in the order they were passed', () => {
    const providers = collectFeatures('provideAbpCore()', [
      withGreeting('hei'),
      withInterceptor('auth'),
    ]);

    expect(createInjector(providers).get(Greeting)).toBe('hei');
    expect(createInjector(providers).get(Interceptors)).toEqual(['auth']);
  });

  it('the same feature passed twice is an error rather than a silent win for the last', () => {
    expect(() =>
      collectFeatures('provideAbpCore()', [withGreeting('hei'), withGreeting('moi')]),
    ).toThrow(DuplicateFeatureError);
  });

  it('a feature declared repeatable may be passed more than once', () => {
    const providers = collectFeatures('provideAbpCore()', [
      withInterceptor('auth'),
      withInterceptor('tenant'),
    ]);

    expect(createInjector(providers).get(Interceptors)).toEqual(['auth', 'tenant']);
  });
});
