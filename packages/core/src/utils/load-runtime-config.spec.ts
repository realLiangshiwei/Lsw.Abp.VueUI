import { describe, expect, it, vi } from 'vitest';
import type { FetchLike } from '../tokens/http.token.js';
import { loadRuntimeConfig } from './load-runtime-config.js';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** What a single-page host answers for a file that is not there. */
const indexHtml = () =>
  new Response('<!doctype html><title>App</title>', {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });

const missing: FetchLike = () => Promise.resolve(indexHtml());

const defaults = {
  apis: { default: { url: 'https://built-in' } },
  application: { name: 'BookStore' },
  production: false,
};

describe('the three levels', () => {
  it('the deployed JSON beats the environment variables and the built-in defaults', async () => {
    const deployed = { apis: { default: { url: 'https://from-json' } } };

    const environment = await loadRuntimeConfig({
      defaults,
      env: { VITE_API_URL: 'https://from-env' },
      fetch: () => Promise.resolve(json(deployed)),
    });

    expect(environment.apis.default.url).toBe('https://from-json');
  });

  it('falls back to the environment variables with no JSON', async () => {
    const environment = await loadRuntimeConfig({
      defaults,
      env: { VITE_API_URL: 'https://from-env' },
      fetch: missing,
    });

    expect(environment.apis.default.url).toBe('https://from-env');
  });

  it('falls back to the built-in defaults when there is neither', async () => {
    const environment = await loadRuntimeConfig({ defaults, fetch: missing });

    expect(environment.apis.default.url).toBe('https://built-in');
  });

  it('returns a complete environment even with nothing configured', async () => {
    const environment = await loadRuntimeConfig({ env: {}, fetch: missing });

    expect(environment).toMatchObject({
      apis: { default: { url: '' } },
      application: { name: 'ABP' },
      production: false,
    });
  });
});

describe('how the levels merge', () => {
  it('a partial JSON leaves the rest in place', async () => {
    const deployed = { apis: { default: { url: 'https://from-json' } } };

    const environment = await loadRuntimeConfig({
      defaults,
      fetch: () => Promise.resolve(json(deployed)),
    });

    expect(environment.application.name).toBe('BookStore');
  });

  it('an environment variable for the application URL does not wipe the application name', async () => {
    const environment = await loadRuntimeConfig({
      defaults,
      env: { VITE_APP_URL: 'https://app.example.com' },
      fetch: missing,
    });

    expect(environment.application).toEqual({
      name: 'BookStore',
      baseUrl: 'https://app.example.com',
    });
  });

  it('the three known environment variables each land in their place', async () => {
    const environment = await loadRuntimeConfig({
      defaults,
      env: {
        VITE_API_URL: 'https://api.example.com',
        VITE_AUTH_URL: 'https://auth.example.com',
        VITE_APP_URL: 'https://app.example.com',
      },
      fetch: missing,
    });

    expect(environment.apis.default.url).toBe('https://api.example.com');
    expect(environment.oAuthConfig?.issuer).toBe('https://auth.example.com');
    expect(environment.application.baseUrl).toBe('https://app.example.com');
  });

  it('keeps custom fields from the JSON', async () => {
    const deployed = { adminConsoleUrl: 'https://console.example.com' };

    const environment = await loadRuntimeConfig({
      defaults,
      fetch: () => Promise.resolve(json(deployed)),
    });

    expect(environment.adminConsoleUrl).toBe('https://console.example.com');
  });
});

describe('when the configuration cannot be fetched', () => {
  it('falls back to the second URL when the first is not there', async () => {
    const fetchImpl = vi.fn<FetchLike>(url =>
      Promise.resolve(
        String(url) === '/getEnvConfig'
          ? json({ apis: { default: { url: 'https://fallback' } } })
          : indexHtml(),
      ),
    );

    const environment = await loadRuntimeConfig({ defaults, fetch: fetchImpl });

    expect(fetchImpl.mock.calls.map(call => String(call[0]))).toEqual([
      '/dynamic-env.json',
      '/getEnvConfig',
    ]);
    expect(environment.apis.default.url).toBe('https://fallback');
  });

  it('both URLs can be chosen by the host', async () => {
    const fetchImpl = vi.fn<FetchLike>(() => Promise.resolve(indexHtml()));

    await loadRuntimeConfig({ url: '/config.json', fallbackUrl: '/env', fetch: fetchImpl });

    expect(fetchImpl.mock.calls.map(call => String(call[0]))).toEqual(['/config.json', '/env']);
  });

  it('treats a 404 as nothing configured', async () => {
    const environment = await loadRuntimeConfig({
      defaults,
      fetch: () => Promise.resolve(new Response('nope', { status: 404 })),
    });

    expect(environment.apis.default.url).toBe('https://built-in');
  });

  it('an unreachable network does not stop startup', async () => {
    const environment = await loadRuntimeConfig({
      defaults,
      fetch: () => Promise.reject(new TypeError('offline')),
    });

    expect(environment.apis.default.url).toBe('https://built-in');
  });

  it('treats an array in the JSON as nothing configured', async () => {
    const environment = await loadRuntimeConfig({
      defaults,
      fetch: () => Promise.resolve(json([1, 2, 3])),
    });

    expect(environment.apis.default.url).toBe('https://built-in');
  });
});
