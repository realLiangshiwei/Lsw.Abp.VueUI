import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, type Rollup } from 'vite';
import { describe, expect, it } from 'vitest';
import { workspaceAliases } from './workspace-aliases.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * An application that uses the extension system the way a page does. Built for
 * production, in memory, from the same sources a consumer's bundler sees.
 */
const application = `
import { AbpExtensibleTable, AbpExtensibleForm, useExtensibleForm } from '@lsw-abpvue/components';
export const parts = [AbpExtensibleTable, AbpExtensibleForm, useExtensibleForm];
`;

async function productionBundle(): Promise<string> {
  const directory = mkdtempSync(join(tmpdir(), 'abpvue-shake-'));
  const entry = join(directory, 'app.ts');
  writeFileSync(entry, application);

  // What decides `import.meta.env.DEV` for the bundle. Vitest runs with `test`, and a
  // build that inherited it would be measuring a development bundle.
  const nodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const output = (await build({
      root: repoRoot,
      logLevel: 'error',
      mode: 'production',
      resolve: { alias: workspaceAliases(resolve(repoRoot, 'packages')) },
      plugins: [vue()],
      build: {
        write: false,
        minify: false,
        lib: { entry, formats: ['es'], fileName: 'app' },
        rollupOptions: { external: ['vue', 'vue-router'] },
      },
    })) as Rollup.RollupOutput[];

    return (output[0]?.output ?? [])
      .map(chunk => (chunk.type === 'chunk' ? chunk.code : ''))
      .join('\n');
  } finally {
    process.env.NODE_ENV = nodeEnv;
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('the extension point inspector', () => {
  it('is not in a production build at all', async () => {
    const bundle = await productionBundle();

    // Design 05 §11: development-only, and the size gate says the string appears zero
    // times. It hangs off `import.meta.env.DEV`, which a production build replaces with
    // `false` -- the branch goes, and the module it imported goes with it.
    expect(bundle).not.toContain('__abpvue');
    expect(bundle).not.toContain('installInspector');
    // The thing it was in the same package as is still there, so the check means
    // something.
    expect(bundle).toContain('abp-extensible-table');
  }, 60_000);
});
