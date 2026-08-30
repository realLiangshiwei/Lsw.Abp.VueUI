import { describe, expect, it, vi } from 'vitest';
import { createInjector } from '../di/injector';
import type { ProviderInput } from '../di/provider';
import type { Environment } from '../models/environment';
import { resolveRootOptions } from '../models/root-options';
import { TenantNotFoundError } from '../models/tenant';
import { HTTP_FETCH, type FetchLike } from '../tokens/http.token';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token';
import { TENANT_NOT_FOUND_BY_NAME } from '../tokens/tenant-not-found.token';
import { EnvironmentService } from './environment.service';
import { MultiTenancyService, tenancyNameFromUrl } from './multi-tenancy.service';
import { WindowService } from './platform/window.service';
import { SessionStateService } from './session-state.service';

const environment: Environment = {
  apis: { default: { url: 'https://{0}.api.abp.io' } },
  application: { name: 'BookStore', baseUrl: 'https://{0}.abp.io/' },
  oAuthConfig: { issuer: 'https://{0}.auth.abp.io', redirectUri: 'https://{0}.abp.io' },
  production: false,
};

const found = (name: string) =>
  new Response(JSON.stringify({ success: true, tenantId: `id-of-${name}`, name, isActive: true }));

function context(href: string, responder: FetchLike, providers: ProviderInput[] = []) {
  const injector = createInjector([
    { provide: HTTP_FETCH, useValue: responder },
    { provide: ABP_ROOT_OPTIONS, useValue: resolveRootOptions({ environment }) },
    {
      provide: WindowService,
      useValue: { nativeWindow: { location: { href } } as unknown as Window, open: () => {} },
    },
    ...providers,
  ]);
  injector.get(SessionStateService).init();

  return injector;
}

describe('reading the tenant out of the host name', () => {
  it.each([
    ['https://{0}.abp.io/', 'https://acme.abp.io/books', 'acme'],
    ['https://{0}.abp.io', 'https://acme.abp.io', 'acme'],
    ['https://abp.io/', 'https://abp.io/books', undefined],
    ['https://{0}.abp.io/', 'https://abp.io/books', undefined],
  ])('%s with %s yields %s', (baseUrl, href, expected) => {
    expect(tenancyNameFromUrl(baseUrl, href)).toBe(expected);
  });
});

describe('resolveFromUrl', () => {
  it('a tenant in the host name is looked up once and recorded as the domain tenant', async () => {
    const injector = context('https://acme.abp.io/books', () => Promise.resolve(found('acme')));
    const service = injector.get(MultiTenancyService);

    await service.resolveFromUrl();

    expect(service.domainTenant.value).toEqual({
      id: 'id-of-acme',
      name: 'acme',
      isAvailable: true,
    });
    expect(service.currentTenant.value?.id).toBe('id-of-acme');
  });

  it('fills in the placeholder before the lookup, or the request would go to a host called {0}', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(found('acme')));
    const injector = context('https://acme.abp.io/books', send);

    await injector.get(MultiTenancyService).resolveFromUrl();

    expect(send.mock.calls[0]?.[0]).toContain('https://acme.api.abp.io/');
    expect(injector.get(EnvironmentService).getEnvironment().oAuthConfig?.issuer).toBe(
      'https://acme.auth.abp.io',
    );
  });

  it('with no tenant in the host name the placeholder goes, dot and all', async () => {
    const injector = context('https://abp.io/books', () => Promise.resolve(found('acme')));

    await injector.get(MultiTenancyService).resolveFromUrl();

    expect(injector.get(EnvironmentService).getEnvironment().apis.default.url).toBe(
      'https://api.abp.io',
    );
  });

  it('the __tenant query parameter is understood as well', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(found('acme')));
    const injector = context('https://abp.io/books?__tenant=id-42', send);

    await injector.get(MultiTenancyService).resolveFromUrl();

    expect(send.mock.calls[0]?.[0]).toContain('/multi-tenancy/tenants/by-id/id-42');
    expect(injector.get(SessionStateService).getTenant()?.id).toBe('id-of-acme');
  });

  it('sends nothing when neither says anything, and the stored tenant stays', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(found('acme')));
    const injector = context('https://abp.io/books', send);
    injector.get(SessionStateService).setTenant({ id: 'kept', isAvailable: true });

    await injector.get(MultiTenancyService).resolveFromUrl();

    expect(send).not.toHaveBeenCalled();
    expect(injector.get(SessionStateService).getTenant()?.id).toBe('kept');
  });

  it('a tenant in the query string that does not exist falls back to the host without stopping startup', async () => {
    const injector = context('https://abp.io/books?__tenant=id-42', () =>
      Promise.resolve(new Response(JSON.stringify({ success: false, isActive: false }))),
    );

    await injector.get(MultiTenancyService).resolveFromUrl();

    expect(injector.get(MultiTenancyService).currentTenant.value).toBeNull();
  });
});

describe('when the host name names a tenant that does not exist', () => {
  const missing = () =>
    Promise.resolve(new Response(JSON.stringify({ success: false, isActive: false })));

  it('does not carry on as the host, which would show data that belongs to somebody else', async () => {
    const injector = context('https://acme.abp.io/', missing);

    await expect(injector.get(MultiTenancyService).resolveFromUrl()).rejects.toBeInstanceOf(
      TenantNotFoundError,
    );
    expect(injector.get(MultiTenancyService).currentTenant.value).toBeNull();
  });

  it('hands it to the registered handler to tell the user', async () => {
    const reported: TenantNotFoundError[] = [];
    const injector = context('https://acme.abp.io/', missing, [
      {
        provide: TENANT_NOT_FOUND_BY_NAME,
        useValue: (error: TenantNotFoundError) => reported.push(error),
      },
    ]);

    await expect(injector.get(MultiTenancyService).resolveFromUrl()).rejects.toBeDefined();

    expect(reported[0]?.tenancyName).toBe('acme');
    expect(String(reported[0]?.message)).toContain('baseUrl');
  });

  it('a failed request counts as not found too, with the reason in cause', async () => {
    const injector = context('https://acme.abp.io/', () =>
      Promise.resolve(new Response('{}', { status: 404, statusText: 'Not Found' })),
    );

    const failure = await injector
      .get(MultiTenancyService)
      .resolveFromUrl()
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(TenantNotFoundError);
    expect((failure as TenantNotFoundError).cause).toMatchObject({ status: 404 });
  });
});
