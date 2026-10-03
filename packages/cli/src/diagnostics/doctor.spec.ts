import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeSolutionFixture } from '../solution/solution-fixture.js';
import type { Check, CheckStatus } from './checks.js';
import { certificateCheck, runDoctor, versionCheck } from './doctor.js';

const FIXTURES = resolve(import.meta.dirname, '../../../../e2e/fixtures');

/** What the fake backend should get wrong on this run. */
interface Faults {
  cors?: string | null;
  discovery?: boolean;
  client?: 'known' | 'unknown';
  /** Replaces one extension property's type with something the mapping does not know. */
  unmappedType?: boolean;
}

async function startBackend(faults: Faults = {}): Promise<{ url: string; server: Server }> {
  const configuration = JSON.parse(
    await readFile(join(FIXTURES, 'application-configuration.json'), 'utf8'),
  ) as {
    objectExtensions: {
      modules: Record<
        string,
        { entities: Record<string, { properties: Record<string, { typeSimple?: string }> }> }
      >;
    };
  };

  if (faults.unmappedType) {
    const property = Object.values(
      configuration.objectExtensions.modules['Identity']?.entities['User']?.properties ?? {},
    )[0];
    if (property) property.typeSimple = 'guid';
  }

  const definition = await readFile(join(FIXTURES, 'api-definition.json'), 'utf8');

  const server = createServer((request, response) => {
    const path = (request.url ?? '').split('?')[0] ?? '';

    if (request.method === 'OPTIONS') {
      const allowed = faults.cors === undefined ? request.headers.origin : faults.cors;
      if (allowed) response.setHeader('access-control-allow-origin', allowed);
      response.writeHead(204).end();
      return;
    }

    if (path === '/.well-known/openid-configuration') {
      if (faults.discovery === false) {
        response.writeHead(404).end('{}');
        return;
      }
      response.end(JSON.stringify({ authorization_endpoint: '/connect/authorize' }));
      return;
    }

    if (path === '/connect/token') {
      response.end(
        JSON.stringify({ error: faults.client === 'unknown' ? 'invalid_client' : 'invalid_grant' }),
      );
      return;
    }

    if (path === '/api/abp/api-definition') {
      response.end(definition);
      return;
    }

    response.end(JSON.stringify(configuration));
  });

  await new Promise<void>(ready => server.listen(0, '127.0.0.1', ready));

  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, server };
}

describe('abpv doctor', () => {
  let root: string;
  let project: string;
  let backend: { url: string; server: Server } | undefined;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'abpvue-doctor-'));
    project = join(root, 'vue');
    await mkdir(join(project, 'public'), { recursive: true });
    await writeSolutionFixture(root);
    await writeFile(join(project, 'package.json'), '{ "dependencies": {} }\n', 'utf8');
    await writeFile(join(project, 'pnpm-lock.yaml'), '', 'utf8');
  });

  afterEach(async () => {
    backend?.server.close();
    backend = undefined;
    await rm(root, { recursive: true, force: true });
  });

  const configure = async (values: Record<string, unknown>) =>
    writeFile(join(project, 'public/dynamic-env.json'), JSON.stringify(values), 'utf8');

  const diagnose = async (faults: Faults = {}, appUrl = 'http://localhost:4200') => {
    backend = await startBackend(faults);
    await configure({
      apis: { default: { url: backend.url } },
      application: { baseUrl: appUrl },
      oAuthConfig: { issuer: backend.url, clientId: 'BookStore_App', redirectUri: appUrl },
    });

    return (await runDoctor({ project, solution: root, environment: false })).checks;
  };

  const status = (checks: Check[], name: string): CheckStatus | undefined =>
    checks.find(check => check.name === name)?.status;

  const detail = (checks: Check[], name: string): string =>
    checks.find(check => check.name === name)?.detail ?? '';

  it('says nothing is configured when the project names no backend', async () => {
    const { checks } = await runDoctor({
      project,
      solution: root,
      offline: true,
      environment: false,
    });

    expect(status(checks, 'configuration')).toBe('fail');
    expect(checks.find(check => check.name === 'configuration')?.fix).toContain('dynamic-env');
  });

  it('reads the ABP version from solution metadata containing comments and trailing commas', async () => {
    await writeFile(
      join(root, 'Acme.BookStore.abpsln'),
      '{ /* ABP solution */ "versions": { "AbpFramework": "10.6.0", }, "languages": ["English",], }',
      'utf8',
    );

    const { checks } = await runDoctor({
      project,
      solution: root,
      offline: true,
      environment: false,
    });

    expect(status(checks, 'versions')).toBe('ok');
    expect(detail(checks, 'versions')).toContain('ABP 10.6.0');
  });

  it('reports an unreadable version instead of crashing on malformed solution metadata', async () => {
    await writeFile(join(root, 'Acme.BookStore.abpsln'), '{ "versions":', 'utf8');

    const { checks } = await runDoctor({
      project,
      solution: root,
      offline: true,
      environment: false,
    });

    expect(status(checks, 'versions')).toBe('warn');
    expect(detail(checks, 'versions')).toContain('no ABP version found');
  });

  it.each([false, true])(
    'reads a sibling backend with an explicit project path: %s',
    async explicit => {
      const directory = join(root, 'Separated');
      const backend = join(directory, 'aspnet-core');
      const frontend = join(directory, 'vue');
      await writeSolutionFixture(backend);
      await mkdir(frontend);
      await writeFile(join(frontend, 'package.json'), '{}');
      await writeFile(
        join(directory, 'Acme.BookStore.abpsln'),
        '{ "versions": { "AbpFramework": "10.6.0" } }',
      );
      const { checks } = await runDoctor({
        project: frontend,
        solution: explicit ? directory : undefined,
        offline: true,
        environment: false,
      });
      expect(status(checks, 'versions')).toBe('ok');
      expect(detail(checks, 'versions')).toContain('ABP 10.6.0');
      expect(status(checks, 'solution')).toBeUndefined();
    },
  );

  it('reports a backend that does not answer', async () => {
    await configure({ apis: { default: { url: 'http://127.0.0.1:1' } } });

    const { checks } = await runDoctor({ project, solution: root, environment: false });

    expect(status(checks, 'backend')).toBe('fail');
  });

  it('reports an origin the backend does not allow', async () => {
    const checks = await diagnose({ cors: null });

    expect(status(checks, 'cors')).toBe('fail');
    expect(detail(checks, 'cors')).toContain('http://localhost:4200');
  });

  it('is satisfied when the backend allows the origin', async () => {
    expect(status(await diagnose(), 'cors')).toBe('ok');
  });

  it('reports an identity server with no discovery document', async () => {
    expect(status(await diagnose({ discovery: false }), 'openid configuration')).toBe('fail');
  });

  it('reports a client the identity server has never heard of', async () => {
    const checks = await diagnose({ client: 'unknown' });

    expect(status(checks, 'openiddict client')).toBe('fail');
    expect(detail(checks, 'openiddict client')).toContain('BookStore_App');
  });

  it('reports a redirect URI the client was not seeded with', async () => {
    const checks = await diagnose({}, 'http://localhost:5173');

    expect(status(checks, 'redirect uri')).toBe('fail');
    expect(checks.find(check => check.name === 'redirect uri')?.fix).toContain('--port 5173');
  });

  it('is satisfied once the solution names the same address', async () => {
    const settings = join(root, 'src/Acme.BookStore.DbMigrator/appsettings.json');
    const text = await readFile(settings, 'utf8');
    await writeFile(settings, text.replace('"BookStore_App"', '"http://localhost:4200"'), 'utf8');

    expect(status(await diagnose(), 'redirect uri')).toBe('ok');
  });

  it('reports an extension property no mapping rule recognises', async () => {
    const checks = await diagnose({ unmappedType: true });

    expect(status(checks, 'object extensions')).toBe('warn');
    expect(detail(checks, 'object extensions')).toContain('guid is not one the mapping knows');
    expect(checks.find(check => check.name === 'object extensions')?.fix).toContain(
      'open an issue',
    );
  });

  it('counts what the backend declares against what the rules recognise', async () => {
    expect(detail(await diagnose(), 'object extensions')).toMatch(/^\d+ declared, \d+ recognised/);
  });

  it('reports a project with no generated proxy', async () => {
    expect(status(await diagnose(), 'proxy')).toBe('warn');
  });

  it('reports the packages that no longer follow their releases', async () => {
    await mkdir(join(project, '.abpvue'), { recursive: true });
    await writeFile(
      join(project, '.abpvue/source-code.json'),
      JSON.stringify({
        packages: {
          '@lsw-abpvue/identity': {
            name: '@lsw-abpvue/identity',
            version: '0.2.0',
            path: 'packages/identity',
            releasedAt: '2026-09-09T00:00:00.000Z',
          },
        },
      }),
      'utf8',
    );

    const checks = await diagnose();

    expect(status(checks, 'released source')).toBe('warn');
    expect(detail(checks, 'released source')).toContain('@lsw-abpvue/identity 0.2.0');
  });

  it('says so when there is no solution to read', async () => {
    const alone = await mkdtemp(join(tmpdir(), 'abpvue-alone-'));

    try {
      const { checks } = await runDoctor({ project: alone, offline: true, environment: false });
      expect(status(checks, 'solution')).toBe('warn');
    } finally {
      await rm(alone, { recursive: true, force: true });
    }
  });
});

describe('the checks that need no backend', () => {
  it('says how to trust the certificate the CLI had to accept', () => {
    const check = certificateCheck({ reachable: true, detail: '', developmentCertificate: true });

    expect(check?.fix).toBe('dotnet dev-certs https --trust');
    expect(certificateCheck({ reachable: true, detail: '' })).toBeUndefined();
  });

  it('warns about an ABP this release has not been tested against', () => {
    expect(versionCheck('9.0.0', { '@lsw-abpvue/core': '0.1.0' }).status).toBe('warn');
    expect(versionCheck('10.5.0', { '@lsw-abpvue/core': '0.1.0' }).status).toBe('ok');
    expect(versionCheck('10.6.0', { '@lsw-abpvue/core': '0.1.0' }).status).toBe('ok');
  });
});
