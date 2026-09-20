import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { inferBackendUrl } from './backend-url.js';
import { readProjectEnvironment } from './project-env.js';
import {
  EMPTY_PROXY_CONFIG,
  readProxyConfig,
  serializeProxyConfig,
  writeProxyConfig,
} from './proxy-config.js';

const directories: string[] = [];

async function project(files: Record<string, string> = {}): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'abpvue-project-'));
  directories.push(directory);

  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(directory, path, '..'), { recursive: true });
    await writeFile(join(directory, path), content, 'utf8');
  }

  return directory;
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })),
  );
});

describe('finding the backend', () => {
  it('reads the runtime configuration an application is deployed with', async () => {
    const directory = await project({
      'public/dynamic-env.json': '{ "apis": { "default": { "url": "https://localhost:44384" } } }',
    });

    await expect(inferBackendUrl(directory)).resolves.toBe('https://localhost:44384');
  });

  it('falls back to the environment file Vite reads', async () => {
    const directory = await project({
      '.env.development': '# the backend\nVITE_API_URL="https://localhost:44305"\n',
    });

    await expect(inferBackendUrl(directory)).resolves.toBe('https://localhost:44305');
  });

  it('prefers the runtime configuration, which is what the application itself uses first', async () => {
    const directory = await project({
      'public/dynamic-env.json': '{ "apis": { "default": { "url": "https://from-json" } } }',
      '.env': 'VITE_API_URL=https://from-env\n',
    });

    await expect(inferBackendUrl(directory)).resolves.toBe('https://from-json');
  });

  it('steps over a malformed file rather than failing on it', async () => {
    const directory = await project({
      'public/dynamic-env.json': '{ not json',
      '.env': 'VITE_API_URL=https://from-env\n',
    });

    await expect(inferBackendUrl(directory)).resolves.toBe('https://from-env');
  });

  it('finds nothing when the project says nothing', async () => {
    await expect(inferBackendUrl(await project())).resolves.toBeUndefined();
  });
});

describe('the proxy configuration', () => {
  it('is empty for a directory that has none, which is the first run', async () => {
    await expect(readProxyConfig(await project())).resolves.toEqual(EMPTY_PROXY_CONFIG);
  });

  it('comes back as it went in', async () => {
    const directory = await project();
    const config = {
      generated: ['models.ts'],
      removed: [],
      modules: { identity: { rootPath: 'identity', remoteServiceName: 'AbpIdentity' } },
      source: { url: 'https://localhost:44384', serviceType: 'application' as const },
    };

    await writeProxyConfig(directory, config);

    await expect(readProxyConfig(directory)).resolves.toEqual(config);
  });

  it('is written sorted, so running the generator twice makes no diff', () => {
    const text = serializeProxyConfig({
      generated: ['b.ts', 'a.ts'],
      removed: [],
      modules: {
        identity: { rootPath: 'identity', remoteServiceName: 'AbpIdentity' },
        account: { rootPath: 'account', remoteServiceName: 'AbpAccount' },
      },
      source: {},
    });

    expect(text.indexOf('"a.ts"')).toBeLessThan(text.indexOf('"b.ts"'));
    expect(text.indexOf('account')).toBeLessThan(text.indexOf('identity'));
    expect(text.endsWith('\n')).toBe(true);
  });
});

describe('what a project says about itself', () => {
  it('reads the client and the addresses out of the deployed configuration', async () => {
    const directory = await project({
      'public/dynamic-env.json': JSON.stringify({
        apis: { default: { url: 'https://localhost:44384' } },
        application: { baseUrl: 'http://localhost:4200' },
        oAuthConfig: { issuer: 'https://localhost:44384', clientId: 'BookStore_App' },
      }),
    });

    await expect(readProjectEnvironment(directory)).resolves.toEqual({
      apiUrl: 'https://localhost:44384',
      appUrl: 'http://localhost:4200',
      authUrl: 'https://localhost:44384',
      clientId: 'BookStore_App',
      scope: undefined,
      redirectUri: undefined,
    });
  });

  it('fills in from the env files what the deployed configuration does not say', async () => {
    const directory = await project({
      'public/dynamic-env.json': '{ "apis": { "default": { "url": "https://localhost:44384" } } }',
      '.env.development': '# where it is served from\nVITE_APP_URL=http://localhost:5173\n',
    });

    const environment = await readProjectEnvironment(directory);

    expect(environment.apiUrl).toBe('https://localhost:44384');
    expect(environment.appUrl).toBe('http://localhost:5173');
  });

  it('says nothing at all about a directory that is not a project', async () => {
    await expect(readProjectEnvironment(await project())).resolves.toEqual({});
  });
});
