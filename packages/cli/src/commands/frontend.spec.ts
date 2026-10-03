import { mkdtemp, rm } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import configuration from '../../../../e2e/fixtures/application-configuration.json';
import definition from '../../../../e2e/fixtures/api-definition.json';
import { readProxyConfig } from '../config/proxy-config.js';
import { reachBackend } from '../diagnostics/backend.js';
import { generateProxy } from './frontend.js';

const roots: string[] = [];
const servers: Server[] = [];
const strictTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

afterEach(async () => {
  if (strictTls === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  else process.env.NODE_TLS_REJECT_UNAUTHORIZED = strictTls;
  await Promise.all(
    servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))),
  );
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});

async function capturedBackend(body: unknown = definition): Promise<string> {
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(request.url?.includes('api-definition') ? body : configuration));
  });
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

async function frontend(apiUrl: string) {
  const root = await mkdtemp(join(tmpdir(), 'abpvue-frontend-proxy-'));
  roots.push(root);
  return { frontend: root, apiUrl, packageManager: 'pnpm', notes: [] as string[] };
}

it('a new frontend generates its application proxy and uses packaged module clients', async () => {
  let url = process.env.ABP_BACKEND_URL ?? 'https://localhost:44384';
  if (!(await reachBackend(url)).reachable) {
    console.info(`[frontend] No ABP backend at ${url}; using the captured definition.`);
    url = await capturedBackend();
  }
  const options = await frontend(url);

  await generateProxy(options);

  const proxy = await readProxyConfig(join(options.frontend, 'src/proxy'));
  expect(Object.keys(proxy.modules)).toEqual(['app']);
  expect(proxy.generated.some(path => path.includes('book.service.ts'))).toBe(true);
  expect(proxy.generated).not.toContain('volo/abp/identity/identity-user.service.ts');
});

it('a backend without application services leaves the new frontend usable', async () => {
  const modules = Object.fromEntries(
    Object.entries(definition.modules).filter(([name]) => name !== 'app'),
  );
  const options = await frontend(await capturedBackend({ ...definition, modules }));

  await generateProxy(options);

  expect((await readProxyConfig(join(options.frontend, 'src/proxy'))).generated).toEqual([]);
  expect(options.notes.join('\n')).toContain('no app module');
});
