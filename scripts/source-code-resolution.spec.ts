import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, normalizePath } from 'vite';
import { expect, it } from 'vitest';
import { templateRoot } from '../packages/cli/src/template/paths.js';
import { renderTemplate } from '../packages/cli/src/template/render.js';

it('released core has one identity for application and installed package imports', async () => {
  const target = await mkdtemp(join(tmpdir(), 'abpvue-source-resolution-'));
  const source = templateRoot();
  try {
    await renderTemplate({
      source,
      target,
      values: {
        projectName: 'Acme.BookStore',
        appName: 'BookStore',
        clientId: 'BookStore_App',
        apiUrl: 'https://localhost:44335',
        authUrl: 'https://localhost:44335',
        appUrl: 'http://localhost:4200',
      },
      blocks: [],
      version: '1.2.3',
    });
    await symlink(join(source, 'node_modules'), join(target, 'node_modules'), 'dir');
    const entry = join(target, 'packages/core/src/index.ts');
    await mkdir(join(target, 'packages/core/src'), { recursive: true });
    await writeFile(entry, 'export const identity = Symbol();\n');
    await writeFile(
      join(target, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { paths: { '@lsw-abpvue/core': ['./packages/core/src/index.ts'] } },
        include: ['src/**/*.ts', 'packages/**/*.ts'],
      }),
    );
    const server = await createServer({
      root: target,
      logLevel: 'silent',
      server: { middlewareMode: true },
      optimizeDeps: { noDiscovery: true, include: [] },
    });
    try {
      const fromApp = await server.environments.client?.pluginContainer.resolveId(
        '@lsw-abpvue/core',
        join(target, 'src/main.ts'),
      );
      const fromPackage = await server.environments.client?.pluginContainer.resolveId(
        '@lsw-abpvue/core',
        join(target, 'node_modules/@lsw-abpvue/theme-shared/dist/index.js'),
      );

      expect(fromApp?.id).toBe(normalizePath(await realpath(entry)));
      expect(fromPackage?.id).toBe(fromApp?.id);
      expect(server.config.optimizeDeps.exclude).toContain('@lsw-abpvue/theme-shared');
    } finally {
      await server.close();
    }
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});
