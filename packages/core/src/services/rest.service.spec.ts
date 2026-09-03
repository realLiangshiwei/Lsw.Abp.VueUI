import { describe, expect, it, vi } from 'vitest';
import { createInjector } from '../di/injector.js';
import type { ProviderInput } from '../di/provider.js';
import type { Environment } from '../models/environment.js';
import { AbpHttpError } from '../models/http.js';
import { resolveRootOptions, type AbpRootOptions } from '../models/root-options.js';
import { HTTP_FETCH, type FetchLike } from '../tokens/http.token.js';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token.js';
import { HttpErrorReporterService } from './http-error-reporter.service.js';
import { HttpWaitService } from './http-wait.service.js';
import { RestService } from './rest.service.js';

const environment: Environment = {
  apis: {
    default: { url: 'https://localhost:44384/' },
    Identity: { url: 'https://identity.example.com' },
  },
  application: { name: 'BookStore' },
  production: false,
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function context(
  responder: FetchLike,
  options: Partial<AbpRootOptions> = {},
  providers: ProviderInput[] = [],
) {
  return createInjector([
    { provide: HTTP_FETCH, useValue: responder },
    { provide: ABP_ROOT_OPTIONS, useValue: resolveRootOptions({ environment, ...options }) },
    ...providers,
  ]);
}

describe('URL', () => {
  it('a relative URL is appended to default, with duplicate slashes removed', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));
    await context(send).get(RestService).request({ method: 'GET', url: '/api/books' });

    expect(send.mock.calls[0]?.[0]).toBe('https://localhost:44384/api/books');
  });

  it('an apiName picks another backend', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));
    await context(send)
      .get(RestService)
      .request({ method: 'GET', url: '/api/identity/users' }, { apiName: 'Identity' });

    expect(send.mock.calls[0]?.[0]).toBe('https://identity.example.com/api/identity/users');
  });

  it('an absolute URL is sent as it is', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));
    await context(send)
      .get(RestService)
      .request({ method: 'GET', url: 'https://other.example.com/x' });

    expect(send.mock.calls[0]?.[0]).toBe('https://other.example.com/x');
  });
});

describe('query parameters', () => {
  const paramsOf = async (
    params: Record<string, unknown>,
    options: Partial<AbpRootOptions> = {},
  ) => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json({})));
    await context(send, options)
      .get(RestService)
      .request({ method: 'GET', url: '/api/books', params });

    return new URL(String(send.mock.calls[0]?.[0])).searchParams;
  };

  it('drops undefined and the empty string', async () => {
    const params = await paramsOf({ filter: '', skip: undefined, sorting: 'name' });

    expect([...params.keys()]).toEqual(['sorting']);
  });

  it('drops null by default', async () => {
    expect([...(await paramsOf({ isActive: null })).keys()]).toEqual([]);
  });

  it('sends null when the host asks for it', async () => {
    const params = await paramsOf({ isActive: null }, { sendNullsAsQueryParam: true });

    expect(params.get('isActive')).toBe('null');
  });

  it('sends 0 and false, which mean something', async () => {
    const params = await paramsOf({ skip: 0, isActive: false });

    expect(params.get('skip')).toBe('0');
    expect(params.get('isActive')).toBe('false');
  });
});

describe('what comes back', () => {
  it('only the body is returned by default', async () => {
    const rest = context(() => Promise.resolve(json({ id: '1' }))).get(RestService);

    await expect(rest.request({ method: 'GET', url: '/api/books/1' })).resolves.toEqual({
      id: '1',
    });
  });

  it('observe response gives the status along with the body', async () => {
    const rest = context(() => Promise.resolve(json({ id: '1' }, 201))).get(RestService);

    await expect(
      rest.request({ method: 'POST', url: '/api/books' }, { observe: 'response' }),
    ).resolves.toMatchObject({ status: 201, body: { id: '1' } });
  });
});

describe('error reporting', () => {
  const failing = () => Promise.resolve(json({ error: { message: 'nope' } }, 500));

  it('a failure reaches the error reporter', async () => {
    const injector = context(failing);
    const seen = vi.fn();
    injector.get(HttpErrorReporterService).onError(seen);

    await expect(
      injector.get(RestService).request({ method: 'GET', url: '/api/books' }),
    ).rejects.toThrow(AbpHttpError);
    expect(seen).toHaveBeenCalledOnce();
  });

  it('nothing is reported when the caller handles it, but the error is still thrown', async () => {
    const injector = context(failing);
    const seen = vi.fn();
    injector.get(HttpErrorReporterService).onError(seen);

    await expect(
      injector
        .get(RestService)
        .request({ method: 'GET', url: '/api/books' }, { skipHandleError: true }),
    ).rejects.toThrow(AbpHttpError);
    expect(seen).not.toHaveBeenCalled();
  });
});

describe('the loading flag', () => {
  it('true while a request is in flight and false once it is back', async () => {
    const injector = context(() => Promise.resolve(json({})));
    const wait = injector.get(HttpWaitService);
    const duringRequest: boolean[] = [];

    const pending = injector.get(RestService).request({ method: 'GET', url: '/api/books' });
    duringRequest.push(wait.loading.value);
    await pending;

    expect(duringRequest).toEqual([true]);
    expect(wait.loading.value).toBe(false);
  });

  it('a failed request gives the count back too', async () => {
    const injector = context(() => Promise.reject(new TypeError('offline')));
    const wait = injector.get(HttpWaitService);

    await expect(
      injector.get(RestService).request({ method: 'GET', url: '/api/books' }),
    ).rejects.toThrow(AbpHttpError);

    expect(wait.loading.value).toBe(false);
  });
});
