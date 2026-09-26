import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCreateLib } from './create-lib.js';

const roots: string[] = [];

async function workspace(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'abpvue-create-lib-'));
  roots.push(directory);

  return directory;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});

const read = (cwd: string, path: string): Promise<string> => readFile(join(cwd, path), 'utf8');

describe('create-lib', () => {
  it('writes the three entry points of design 03', async () => {
    const cwd = await workspace();
    const result = await runCreateLib({ cwd, name: 'Blogging' });

    expect(result.files).toContain('src/index.ts');
    expect(result.files).toContain('config/src/index.ts');
    expect(result.files).toContain('proxy/src/index.ts');
    expect(result.packageName).toBe('abp-vue-blogging');
    expect(result.target).toBe('blogging');
  });

  it('renames the template’s example module, in the code and in the file names', async () => {
    const cwd = await workspace();
    const { files } = await runCreateLib({ cwd, name: 'Blogging' });

    expect(files).toContain('src/components/BloggingPage.vue');
    expect(files).toContain('src/providers/blogging.provider.ts');
    expect(files).toContain('config/src/providers/blogging-config.provider.ts');
    expect(files.join('\n')).not.toMatch(/sample/i);

    const index = await read(cwd, 'blogging/src/index.ts');

    expect(index).toContain('export { createBloggingRoutes }');
    expect(index).toContain('BLOGGING_ENTITY_PROP_CONTRIBUTORS');
    expect(index).not.toMatch(/sample/i);
  });

  it('takes the package name everywhere it is written, imports included', async () => {
    const cwd = await workspace();
    await runCreateLib({ cwd, name: 'Blogging', package: '@acme/blogging-vue' });

    const manifest = JSON.parse(await read(cwd, 'blogging/package.json')) as { name: string };

    expect(manifest.name).toBe('@acme/blogging-vue');
    // The package refers to its own secondary entry point by name, so the tsconfig has
    // to map it back to the source or a type check would need a build first.
    expect(await read(cwd, 'blogging/tsconfig.json')).toContain(
      '"@acme/blogging-vue/config": ["./config/src/index.ts"]',
    );
    expect(await read(cwd, 'blogging/src/routes.ts')).toContain("from '@acme/blogging-vue/config'");
  });

  it('turns the workspace protocol into the version of the CLI that wrote it', async () => {
    const cwd = await workspace();
    await runCreateLib({ cwd, name: 'Blogging' });

    const manifest = JSON.parse(await read(cwd, 'blogging/package.json')) as {
      peerDependencies: Record<string, string>;
    };

    expect(manifest.peerDependencies['@lsw-abpvue/core']).not.toMatch(/^workspace:/);
  });

  it('names the module in the description unless told otherwise', async () => {
    const cwd = await workspace();
    await runCreateLib({ cwd, name: 'Blogging', description: 'Blogs, in Vue.' });

    const manifest = JSON.parse(await read(cwd, 'blogging/package.json')) as {
      description: string;
    };

    expect(manifest.description).toBe('Blogs, in Vue.');
  });

  it('takes a name in any case and writes the conventional one', async () => {
    const cwd = await workspace();
    const result = await runCreateLib({ cwd, name: 'my-blog' });

    expect(result.name).toBe('MyBlog');
    expect(result.files).toContain('src/components/MyBlogPage.vue');
  });

  it('refuses to write over a directory that is already there', async () => {
    const cwd = await workspace();
    await mkdir(join(cwd, 'blogging'), { recursive: true });

    await expect(runCreateLib({ cwd, name: 'Blogging' })).rejects.toThrow(/already there/);
  });

  it('a dry run writes nothing', async () => {
    const cwd = await workspace();
    const result = await runCreateLib({ cwd, name: 'Blogging', 'dry-run': true });

    expect(result.files.length).toBeGreaterThan(0);
    await expect(read(cwd, 'blogging/package.json')).rejects.toThrow();
  });

  it('leaves nothing behind when it cannot finish', async () => {
    const cwd = await workspace();

    // A template with a file the renderer cannot fill in: it fails half way through.
    const broken = join(cwd, 'broken-template');
    await mkdir(broken, { recursive: true });
    await writeFile(join(broken, 'template.json'), '{"blocks":{}}', 'utf8');
    await writeFile(join(broken, 'a.ts'), 'export const a = 1;\n', 'utf8');
    await writeFile(join(broken, 'b.ts'), 'export const b = __NOT_A_VALUE__;\n', 'utf8');

    await expect(runCreateLib({ cwd, name: 'Blogging', template: broken })).rejects.toThrow(
      /Could not write the package/,
    );

    // Half a package is worse than none: the next run would refuse to write over it.
    await expect(readFile(join(cwd, 'blogging/a.ts'), 'utf8')).rejects.toThrow();
  });

  it('says what to pass when it is given no name', async () => {
    const cwd = await workspace();

    await expect(runCreateLib({ cwd })).rejects.toThrow(/Which module/);
  });
});
