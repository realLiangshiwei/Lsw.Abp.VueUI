import { describe, expect, it } from 'vitest';
import { decodeJwt } from './jwt.js';

/** A JWT is three base64url segments; only the middle one carries claims. */
function jwt(claims: Record<string, unknown>): string {
  const payload = btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `header.${payload}.signature`;
}

describe('reading the claims of a JWT', () => {
  it('reads the claims', () => {
    expect(decodeJwt(jwt({ remember_me: true, sub: 'abc' }))).toEqual({
      remember_me: true,
      sub: 'abc',
    });
  });

  it('decodes the - and _ of base64url', () => {
    expect(decodeJwt(jwt({ name: 'aa?~ff>>' }))).toEqual({ name: 'aa?~ff>>' });
  });

  it('a string that is not a JWT reads as no claims', () => {
    expect(decodeJwt('not-a-token')).toBeUndefined();
    expect(decodeJwt('a.!!!.c')).toBeUndefined();
    expect(decodeJwt('')).toBeUndefined();
  });

  it('a payload that is not an object reads as no claims too', () => {
    expect(decodeJwt(jwt([] as unknown as Record<string, unknown>))).toBeUndefined();
  });
});
