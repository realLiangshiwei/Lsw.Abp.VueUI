import { describe, expect, it, vi } from 'vitest';
import configurationFixture from '../../../../e2e/fixtures/application-configuration.json';
import { createInjector, type Injector } from '../di/injector.js';
import type { HttpInterceptor, RestConfig } from '../models/http.js';
import type { ApplicationConfigurationDto } from '../proxy/models.js';
import { ConfigStateService } from '../services/config-state.service.js';
import { RestService } from '../services/rest.service.js';
import { SessionStateService } from '../services/session-state.service.js';
import { HTTP_FETCH, HTTP_INTERCEPTORS, type FetchLike } from '../tokens/http.token.js';
import { languageInterceptor } from './language.interceptor.js';
import { tenantInterceptor } from './tenant.interceptor.js';
import { timezoneInterceptor } from './timezone.interceptor.js';

const fixture = configurationFixture as unknown as ApplicationConfigurationDto;

/** Sends one request through the interceptor and reports the headers that came out. */
async function headersOf(
  interceptor: () => HttpInterceptor,
  prepare: (injector: Injector) => void = () => {},
  config?: RestConfig,
): Promise<Record<string, string>> {
  const send = vi.fn<FetchLike>(() => Promise.resolve(new Response('{}')));
  const injector = createInjector([
    { provide: HTTP_FETCH, useValue: send },
    { provide: HTTP_INTERCEPTORS, multi: true, useFactory: interceptor },
  ]);

  injector.get(SessionStateService).init();
  prepare(injector);
  await injector.get(RestService).request({ method: 'GET', url: '/api/books' }, config);

  return (send.mock.calls[0]?.[1]?.headers ?? {}) as Record<string, string>;
}

const withClock = (kind: string, timeZone?: string) => (injector: Injector) =>
  injector.get(ConfigStateService).setState({
    ...fixture,
    clock: { kind },
    setting: {
      values: {
        ...fixture.setting.values,
        ...(timeZone ? { 'Abp.Timing.TimeZone': timeZone } : {}),
      },
    },
  });

describe('the tenant header', () => {
  const withTenant = (injector: Injector) =>
    injector.get(SessionStateService).setTenant({ id: 'tenant-1', isAvailable: true });

  it('sends the tenant when the session has one', async () => {
    expect(await headersOf(tenantInterceptor, withTenant)).toMatchObject({ __tenant: 'tenant-1' });
  });

  it('sends nothing without a tenant', async () => {
    expect(await headersOf(tenantInterceptor)).not.toHaveProperty('__tenant');
  });

  it('adds nothing when the caller asked for no headers', async () => {
    const headers = await headersOf(tenantInterceptor, withTenant, { skipAddingHeader: true });

    expect(headers).not.toHaveProperty('__tenant');
  });
});

describe('the language header', () => {
  it('tells the backend which language was chosen', async () => {
    const headers = await headersOf(languageInterceptor, injector =>
      injector.get(SessionStateService).setLanguage('tr'),
    );

    expect(headers).toMatchObject({ 'Accept-Language': 'tr' });
  });

  it('lets the backend decide while no language has been chosen', async () => {
    expect(await headersOf(languageInterceptor)).not.toHaveProperty('Accept-Language');
  });
});

describe('the timezone header', () => {
  it('tells the backend which timezone to use when it stores times as UTC', async () => {
    const headers = await headersOf(timezoneInterceptor, withClock('Utc', 'Europe/Helsinki'));

    expect(headers).toMatchObject({ __timezone: 'Europe/Helsinki' });
  });

  it('falls back to the browser timezone when none is configured', async () => {
    const headers = await headersOf(timezoneInterceptor, withClock('Utc'));

    expect(headers.__timezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it('a backend on a local clock needs no such header', async () => {
    expect(await headersOf(timezoneInterceptor, withClock('Local'))).not.toHaveProperty(
      '__timezone',
    );
  });
});

describe('skipping the headers', () => {
  it('the language header honours skipAddingHeader too', async () => {
    const headers = await headersOf(
      languageInterceptor,
      injector => injector.get(SessionStateService).setLanguage('tr'),
      { skipAddingHeader: true },
    );

    expect(headers).not.toHaveProperty('Accept-Language');
  });

  it('the timezone header honours skipAddingHeader too', async () => {
    const headers = await headersOf(timezoneInterceptor, withClock('Utc', 'Europe/Helsinki'), {
      skipAddingHeader: true,
    });

    expect(headers).not.toHaveProperty('__timezone');
  });
});
