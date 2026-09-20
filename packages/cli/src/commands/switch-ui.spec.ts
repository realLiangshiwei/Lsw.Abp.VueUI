import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CliError } from '../errors.js';
import { writeSolutionFixture } from '../solution/solution-fixture.js';
import { run } from '../system/run.js';
import { runSwitchUi, type SwitchUiArgs } from './switch-ui.js';

const MODULE_FILE = join('src', 'Acme.BookStore.HttpApi.Host', 'BookStoreHttpApiHostModule.cs');

describe('abpv switch-ui', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'abpvue-switch-'));
    await writeSolutionFixture(root, { generatedUi: 'angular' });
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const switchUi = (args: SwitchUiArgs = {}) =>
    runSwitchUi({
      solution: root,
      cwd: root,
      'skip-proxy': true,
      'skip-install': true,
      ...args,
    });

  it('writes the application beside the solution it belongs to', async () => {
    const result = await switchUi();

    expect(result.frontend).toBe(join(root, 'vue'));
    expect(result.files).toContain('src/main.ts');
    expect(await readFile(join(root, 'vue/public/dynamic-env.json'), 'utf8')).toContain(
      '"url": "https://localhost:44335"',
    );
  });

  it('moves the generated UI aside rather than deleting it', async () => {
    const result = await switchUi();

    expect(result.renamed.map(entry => entry.to)).toEqual([join(root, 'angular.bak')]);
    await expect(stat(join(root, 'angular.bak/angular.json'))).resolves.toBeDefined();
    await expect(stat(join(root, 'angular'))).rejects.toThrow();
  });

  it('leaves the generated UI where it is when asked to keep it', async () => {
    const result = await switchUi({ mode: 'keep' });

    expect(result.renamed).toEqual([]);
    await expect(stat(join(root, 'angular/angular.json'))).resolves.toBeDefined();
  });

  it('refuses a mode it does not have', async () => {
    await expect(switchUi({ mode: 'delete' })).rejects.toThrow(CliError);
  });

  it('moves an application it wrote before aside as well, so a rerun loses nothing', async () => {
    await switchUi();
    await writeFile(join(root, 'vue/notes.md'), 'mine\n', 'utf8');

    const result = await switchUi();

    expect(result.renamed.map(entry => entry.to)).toContain(join(root, 'vue.bak'));
    await expect(stat(join(root, 'vue.bak/notes.md'))).resolves.toBeDefined();
  });

  it('configures the backend, keeping a copy of every file it edits', async () => {
    const result = await switchUi();

    expect(result.edits.map(edit => edit.key)).toEqual([
      'OpenIddict:Applications:BookStore_App:RootUrl',
      'App:CorsOrigins',
    ]);

    const migrator = await readdir(join(root, 'src/Acme.BookStore.DbMigrator'));
    expect(migrator.filter(name => name.endsWith('.bak'))).toHaveLength(1);
  });

  it('leaves the C# alone, whatever else it changes', async () => {
    const before = await readFile(join(root, MODULE_FILE), 'utf8');
    await switchUi();

    expect(await readFile(join(root, MODULE_FILE), 'utf8')).toBe(before);
  });

  it('leaves the appsettings alone when asked to', async () => {
    expect((await switchUi({ 'skip-backend-config': true })).edits).toEqual([]);
  });

  it('says what it would change without changing any of it', async () => {
    const result = await switchUi({ 'dry-run': true });

    expect(result.files).toContain('src/main.ts');
    expect(result.renamed.map(entry => entry.to)).toEqual([join(root, 'angular.bak')]);
    await expect(stat(join(root, 'vue'))).rejects.toThrow();
    await expect(stat(join(root, 'angular'))).resolves.toBeDefined();
  });

  it('puts everything back when it fails half way', async () => {
    const settings = join(root, 'src/Acme.BookStore.DbMigrator/appsettings.json');
    const before = await readFile(settings, 'utf8');

    // Renders nothing, so the failure comes after the rename and before the edits.
    await expect(switchUi({ template: 'no-such-template' })).rejects.toThrow();

    await expect(stat(join(root, 'angular/angular.json'))).resolves.toBeDefined();
    await expect(stat(join(root, 'vue'))).rejects.toThrow();
    expect(await readFile(settings, 'utf8')).toBe(before);
  });

  it('puts the configuration back when a later step fails', async () => {
    // A backend that answers, but with nothing the generator can use: reachable, then
    // fatal -- which is the one path that runs after the appsettings were edited.
    const server = createServer((_request, response) => response.end('{}'));
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;

    const solution = await mkdtemp(join(tmpdir(), 'abpvue-switch-'));
    await writeSolutionFixture(solution, { hostUrl: `http://127.0.0.1:${port}` });
    const settings = join(solution, 'src/Acme.BookStore.DbMigrator/appsettings.json');
    const before = await readFile(settings, 'utf8');

    try {
      await expect(
        runSwitchUi({ solution, cwd: solution, 'skip-install': true }),
      ).rejects.toThrow();

      expect(await readFile(settings, 'utf8')).toBe(before);
      await expect(stat(join(solution, 'vue'))).rejects.toThrow();
    } finally {
      server.close();
      await rm(solution, { recursive: true, force: true });
    }
  });

  it('refuses a checkout with uncommitted work in it', async () => {
    await run('git', ['init'], { cwd: root });
    await run('git', ['add', '.'], { cwd: root });

    await expect(switchUi()).rejects.toThrow(CliError);
    await expect(switchUi({ force: true })).resolves.toBeDefined();
  });
});
