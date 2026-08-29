import { describe, expect, it, vi } from 'vitest';
import { createInjector } from '../di/injector';
import type { ProviderInput } from '../di/provider';
import { AbpHttpError, type HttpInterceptor } from '../models/http';
import { HTTP_FETCH, HTTP_INTERCEPTORS, type FetchLike } from '../tokens/http.token';
import { HttpClient } from './http-client.service';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * The seam of V9: a fetch that answers with a real `Response`, so the transport is
 * exercised for statuses a live backend will not produce on request.
 */
function client(responder: FetchLike, providers: ProviderInput[] = []) {
  return createInjector([{ provide: HTTP_FETCH, useValue: responder }, ...providers]).get(
    HttpClient,
  );
}

describe('sending a request', () => {
  it('gives the parsed JSON back', async () => {
    const http = client(() => Promise.resolve(json({ totalCount: 2 })));

    await expect(http.request({ method: 'GET', url: '/api/books' })).resolves.toMatchObject({
      status: 200,
      body: { totalCount: 2 },
    });
  });

  it('query parameters reach the URL, arrays repeat and dates are ISO', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));
    await client(send).request({
      method: 'GET',
      url: '/api/books',
      params: {
        filter: 'abp',
        skip: 0,
        tags: ['a', 'b'],
        since: new Date('2026-01-02T03:04:05.000Z'),
        missing: undefined,
      },
    });

    expect(send.mock.calls[0]?.[0]).toBe(
      '/api/books?filter=abp&skip=0&tags=a&tags=b&since=2026-01-02T03%3A04%3A05.000Z',
    );
  });

  it('appends with & when the URL already carries a query string', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));
    await client(send).request({
      method: 'GET',
      url: '/api/books?sorting=name',
      params: { skip: 10 },
    });

    expect(send.mock.calls[0]?.[0]).toBe('/api/books?sorting=name&skip=10');
  });

  it('an object body is serialised and carries a content-type', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));
    await client(send).request({ method: 'POST', url: '/api/books', body: { name: 'Dune' } });

    const init = send.mock.calls[0]?.[1];
    expect(init?.body).toBe('{"name":"Dune"}');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('hands FormData to fetch untouched and sets no content-type', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));
    const body = new FormData();

    await client(send).request({ method: 'POST', url: '/api/files', body });

    expect(send.mock.calls[0]?.[1]?.body).toBe(body);
    expect(send.mock.calls[0]?.[1]?.headers).toEqual({});
  });

  it('asking for binary declares Accept and yields a Blob', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(new Response('binary')));
    const response = await client(send).request({
      method: 'GET',
      url: '/api/export',
      responseType: 'blob',
    });

    expect(send.mock.calls[0]?.[1]?.headers).toMatchObject({ Accept: 'application/octet-stream' });
    expect(response.body).toBeInstanceOf(Blob);
  });

  it('reads an empty body such as a 204 as undefined', async () => {
    const http = client(() => Promise.resolve(new Response(null, { status: 204 })));

    await expect(http.request({ method: 'DELETE', url: '/api/books/1' })).resolves.toMatchObject({
      status: 204,
      body: undefined,
    });
  });

  it('the signal reaches fetch, so the caller can cancel', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));
    const controller = new AbortController();

    await client(send).request({ method: 'GET', url: '/api/books', signal: controller.signal });

    expect(send.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });
});

describe('when it fails', () => {
  const envelope = {
    error: { code: 'Volo.Abp:010002', message: 'The record was not found.', details: 'gone' },
  };

  it('unwraps the ABP error envelope', async () => {
    const http = client(() => Promise.resolve(json(envelope, 404)));

    const failure = await http.request({ method: 'GET', url: '/api/books/9' }).catch(e => e);

    expect(failure).toBeInstanceOf(AbpHttpError);
    expect(failure).toMatchObject({
      status: 404,
      error: { code: 'Volo.Abp:010002', message: 'The record was not found.' },
    });
    expect(failure.message).toContain('The record was not found.');
  });

  it('a binary request still parses the envelope out of the error as text', async () => {
    const http = client(() =>
      Promise.resolve(
        new Response(JSON.stringify(envelope), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const failure = await http
      .request({ method: 'GET', url: '/api/export', responseType: 'blob' })
      .catch(e => e);

    expect(failure.error?.code).toBe('Volo.Abp:010002');
  });

  it('a body that is not an ABP envelope stays in raw', async () => {
    const http = client(() => Promise.resolve(new Response('<html>502</html>', { status: 502 })));

    const failure = await http.request({ method: 'GET', url: '/api/books' }).catch(e => e);

    expect(failure.error).toBeUndefined();
    expect(failure.raw).toBe('<html>502</html>');
    expect(failure.status).toBe(502);
  });

  it('a request that never went out has a status of 0 and says it was a transport failure', async () => {
    const cause = new TypeError('Failed to fetch');
    const http = client(() => Promise.reject(cause));

    const failure = await http.request({ method: 'GET', url: '/api/books' }).catch(e => e);

    expect(failure).toBeInstanceOf(AbpHttpError);
    expect(failure.isTransportFailure).toBe(true);
    expect(failure.raw).toBe(cause);
  });

  it('says the body could not be read when a 200 is not JSON', async () => {
    const http = client(() => Promise.resolve(new Response('not json', { status: 200 })));

    const failure = await http.request({ method: 'GET', url: '/api/books' }).catch(e => e);

    expect(failure).toBeInstanceOf(AbpHttpError);
    expect(failure.error?.message).toContain('could not be read as JSON');
  });
});

describe('interceptors', () => {
  const record = (log: string[], name: string): HttpInterceptor => {
    return async (request, next) => {
      log.push(`${name} in`);
      const response = await next({ ...request, headers: { ...request.headers, [name]: 'yes' } });
      log.push(`${name} out`);
      return response;
    };
  };

  it('the first registered is outermost: requests travel in, responses out', async () => {
    const log: string[] = [];
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));

    await client(send, [
      { provide: HTTP_INTERCEPTORS, multi: true, useFactory: () => record(log, 'first') },
      { provide: HTTP_INTERCEPTORS, multi: true, useFactory: () => record(log, 'second') },
    ]).request({ method: 'GET', url: '/api/books' });

    expect(log).toEqual(['first in', 'second in', 'second out', 'first out']);
    expect(send.mock.calls[0]?.[1]?.headers).toMatchObject({ first: 'yes', second: 'yes' });
  });

  it('an interceptor can answer instead, and the request never goes out', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));
    const canned: HttpInterceptor = () =>
      Promise.resolve({ status: 200, statusText: 'OK', headers: new Headers(), body: 'cached' });

    const response = await client(send, [
      { provide: HTTP_INTERCEPTORS, multi: true, useValue: canned },
    ]).request({ method: 'GET', url: '/api/books' });

    expect(response.body).toBe('cached');
    expect(send).not.toHaveBeenCalled();
  });
});
