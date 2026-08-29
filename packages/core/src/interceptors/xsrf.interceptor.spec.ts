// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createInjector } from '../di/injector';
import { HttpClient } from '../services/http-client.service';
import { CookieService } from '../services/platform/cookie.service';
import { HTTP_FETCH, HTTP_INTERCEPTORS, type FetchLike } from '../tokens/http.token';
import { xsrfInterceptor } from './xsrf.interceptor';

function client(send: FetchLike) {
  return createInjector([
    { provide: HTTP_FETCH, useValue: send },
    { provide: HTTP_INTERCEPTORS, multi: true, useFactory: xsrfInterceptor },
  ]);
}

describe('the xsrf interceptor', () => {
  it('a write carries the token from the cookie', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(new Response(null, { status: 204 })));
    const injector = client(send);
    injector.get(CookieService).set('XSRF-TOKEN', 'token-123');

    await injector.get(HttpClient).request({ method: 'POST', url: '/api/books' });

    expect(send.mock.calls[0]?.[1]?.headers).toMatchObject({
      RequestVerificationToken: 'token-123',
    });
  });

  it('a read needs no token', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(new Response('{}')));
    const injector = client(send);
    injector.get(CookieService).set('XSRF-TOKEN', 'token-123');

    await injector.get(HttpClient).request({ method: 'GET', url: '/api/books' });

    expect(send.mock.calls[0]?.[1]?.headers).not.toHaveProperty('RequestVerificationToken');
  });

  it('a header the caller wrote is not overwritten', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(new Response(null, { status: 204 })));
    const injector = client(send);
    injector.get(CookieService).set('XSRF-TOKEN', 'token-123');

    await injector.get(HttpClient).request({
      method: 'POST',
      url: '/api/books',
      headers: { RequestVerificationToken: 'mine' },
    });

    expect(send.mock.calls[0]?.[1]?.headers).toMatchObject({ RequestVerificationToken: 'mine' });
  });

  it('adds nothing when there is no cookie', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(new Response(null, { status: 204 })));
    const injector = client(send);
    injector.get(CookieService).remove('XSRF-TOKEN');

    await injector.get(HttpClient).request({ method: 'POST', url: '/api/books' });

    expect(send.mock.calls[0]?.[1]?.headers).not.toHaveProperty('RequestVerificationToken');
  });
});
