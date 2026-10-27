import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { moduleBlocks, readTemplateManifest } from '../packages/cli/src/template/manifest.js';
import { renderTemplate } from '../packages/cli/src/template/render.js';

it('every application module includes its workspace peer dependency closure', async () => {
  const source = resolve(import.meta.dirname, '../templates/app');
  const template = await readTemplateManifest(source);
  for (const module of moduleBlocks(template)) {
    const blocks = [module, ...(template.blocks[module]?.requires ?? [])];
    const result = await renderTemplate({
      source,
      target: '/unused',
      blocks,
      dryRun: true,
      version: '1.2.3',
      values: {
        projectName: 'Acme.App',
        appName: 'App',
        apiUrl: 'https://localhost:44300',
        authUrl: 'https://localhost:44300',
        appUrl: 'http://localhost:4200',
        clientId: 'App_App',
      },
    });
    const dependencies = (
      JSON.parse(result.contents['package.json'] ?? '{}') as {
        dependencies: Record<string, string>;
      }
    ).dependencies;
    for (const name of Object.keys(dependencies).filter(name => name.startsWith('@lsw-abpvue/'))) {
      const manifest = JSON.parse(
        await readFile(
          resolve(import.meta.dirname, '../packages', name.split('/')[1] ?? '', 'package.json'),
          'utf8',
        ),
      ) as {
        peerDependencies?: Record<string, string>;
      };
      for (const peer of Object.keys(manifest.peerDependencies ?? {}).filter(peer =>
        peer.startsWith('@lsw-abpvue/'),
      )) {
        expect(dependencies[peer], `${module}: ${name} needs ${peer}`).toBeDefined();
      }
    }
  }
});
