import { describe, expect, it } from 'vitest';
import { createInjector } from './injector';
import { defineService, defineToken } from './token';

describe('defineToken', () => {
  it('two tokens of the same name are two identities', () => {
    const one = defineToken<string>('Name');
    const other = defineToken<string>('Name');

    expect(one.key).not.toBe(other.key);
    expect(createInjector([{ provide: one, useValue: 'one' }]).get(one, null)).toBe('one');
    expect(createInjector([{ provide: one, useValue: 'one' }]).get(other, null)).toBeNull();
  });

  it('a token is neither multi nor implemented by default', () => {
    const token = defineToken<string>('Plain');

    expect(token.multi).toBe(false);
    expect(token.factory).toBeUndefined();
  });

  it('a token from defineService carries its own root implementation', () => {
    const service = defineService('Service', () => ({ answer: 42 }));

    expect(service.multi).toBe(false);
    expect(createInjector([]).get(service).answer).toBe(42);
  });
});
