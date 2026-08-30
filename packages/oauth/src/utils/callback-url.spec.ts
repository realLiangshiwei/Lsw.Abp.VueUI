import { describe, expect, it } from 'vitest';
import {
  cultureFromCallback,
  cultureParams,
  isAuthorizationCallback,
  withoutCallbackParams,
} from './callback-url';

const url = (href: string) => new URL(href, 'https://app.abp.io');

describe('the authorization callback URL', () => {
  it('only a code or an error makes it a callback', () => {
    expect(isAuthorizationCallback(url('/?code=abc&state=xyz'))).toBe(true);
    expect(isAuthorizationCallback(url('/?error=access_denied'))).toBe(true);
    expect(isAuthorizationCallback(url('/books?page=2'))).toBe(false);
  });

  it('clears the traces of the round trip and keeps the query string of the host', () => {
    expect(
      withoutCallbackParams(url('/books?code=abc&state=xyz&iss=srv&ui-culture=tr&page=2#top')),
    ).toBe('/books?page=2#top');
  });

  it('reads the interface culture the backend actually used', () => {
    expect(cultureFromCallback(url('/?code=abc&ui-culture=tr'))).toBe('tr');
    expect(cultureFromCallback(url('/?code=abc'))).toBeUndefined();
  });

  it('sends no culture to the login page when none was chosen', () => {
    expect(cultureParams('tr')).toEqual({ culture: 'tr', 'ui-culture': 'tr' });
    expect(cultureParams(null)).toEqual({});
  });
});
