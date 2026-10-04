import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CliError } from '../errors.js';
import { writeSolutionFixture } from '../solution/solution-fixture.js';
import { run } from '../system/run.js';
import { templateRoot } from '../template/paths.js';
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

  it('previews every new file and backend edit without changing existing files', async () => {
    const path = join(root, 'src/Acme.BookStore.HttpApi.Host/appsettings.json');
    const before = await readFile(path, 'utf8');
    const result = await switchUi({ 'dry-run': true });
    const diff = result.diff.join('\n');
    expect(diff).toContain('rename from angular');
    expect(diff).toContain('+++ b/vue/src/main.ts');
    expect(diff).toContain('+const loadedEnvironment = await loadRuntimeConfig');
    expect(diff).toContain('+++ b/src/Acme.BookStore.HttpApi.Host/appsettings.json');
    expect(diff).toContain('+');
    expect(diff).toContain('http://localhost:4200');
    expect(await readFile(path, 'utf8')).toBe(before);
    await expect(stat(join(root, 'vue'))).rejects.toThrow();
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

  it('would do what it does: the dry run and the real one agree', async () => {
    const planned = await switchUi({ 'dry-run': true });
    const done = await switchUi();

    expect(done.files).toEqual(planned.files);
    expect(done.renamed).toEqual(planned.renamed);
    expect(done.edits.map(edit => `${edit.file} ${edit.key} ${edit.to}`)).toEqual(
      planned.edits.map(edit => `${edit.file} ${edit.key} ${edit.to}`),
    );
  });
  it('previews the available backup name when a previous backup already exists', async () => {
    await mkdir(join(root, 'angular.bak'));
    await mkdir(join(root, 'angular.1.bak'));
    const planned = await switchUi({ 'dry-run': true });
    const done = await switchUi();
    expect(planned.renamed[0]?.to).toBe(join(root, 'angular.2.bak'));
    expect(done.renamed).toEqual(planned.renamed);
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

  it.each(['keep', 'replace'])('places Vue beside aspnet-core in %s mode', async mode => {
    const project = join(root, 'Separated');
    const backend = join(project, 'aspnet-core');
    await writeSolutionFixture(backend);
    await mkdir(join(project, 'angular'));
    await writeFile(join(project, 'angular/angular.json'), '{}');
    const result = await switchUi({ solution: project, cwd: project, mode });
    expect(result.solution.root).toBe(backend);
    expect(result.frontend).toBe(join(project, 'vue'));
    await expect(stat(join(backend, 'vue'))).rejects.toThrow();
    const angular = mode === 'keep' ? 'angular' : 'angular.bak';
    await expect(stat(join(project, angular, 'angular.json'))).resolves.toBeDefined();
  });

  it('previews backend paths relative to the project directory', async () => {
    const project = join(root, 'Separated');
    const backend = join(project, 'aspnet-core');
    await writeSolutionFixture(backend);
    const result = await switchUi({ solution: backend, cwd: project, 'dry-run': true });
    expect(result.diff.join('\n')).toContain('+++ b/vue/src/main.ts');
    expect(result.diff.join('\n')).toContain(
      '+++ b/aspnet-core/src/Acme.BookStore.HttpApi.Host/appsettings.json',
    );
    await expect(stat(join(project, 'vue'))).rejects.toThrow();
  });

  it('previews nested frontend renames with portable paths', async () => {
    await mkdir(join(root, 'frontend', 'app'), { recursive: true });
    await writeFile(join(root, 'frontend', 'app', 'notes.md'), 'mine');
    const result = await switchUi({ dir: 'frontend/app', 'dry-run': true });
    expect(result.diff.join('\n')).toContain(
      'diff --git a/frontend/app b/frontend/app.bak\nrename from frontend/app\nrename to frontend/app.bak',
    );
    expect(await readFile(join(root, 'frontend', 'app', 'notes.md'), 'utf8')).toBe('mine');
  });

  it('previews binary files with portable paths', async () => {
    const source = join(root, 'custom-template');
    await cp(templateRoot(), source, {
      recursive: true,
      filter: file => !file.includes('node_modules'),
    });
    await writeFile(join(source, 'public', 'logo.png'), new Uint8Array([0, 1, 2]));
    const result = await switchUi({ dir: 'frontend/app', template: source, 'dry-run': true });
    expect(result.diff.join('\n')).toContain(
      'Binary files /dev/null and b/frontend/app/public/logo.png differ',
    );
    await expect(stat(join(root, 'frontend'))).rejects.toThrow();
  });

  it('refuses uncommitted work in a backend with its own Git repository', async () => {
    const project = join(root, 'Separated');
    const backend = join(project, 'aspnet-core');
    await writeSolutionFixture(backend);
    await run('git', ['init'], { cwd: backend });
    await run('git', ['add', '.'], { cwd: backend });
    await expect(switchUi({ solution: project, cwd: project })).rejects.toThrow(
      'uncommitted changes',
    );
    await expect(stat(join(project, 'vue'))).rejects.toThrow();
  });

  it('discovers the backend from an existing frontend directory', async () => {
    const project = join(root, 'Separated');
    await writeSolutionFixture(join(project, 'aspnet-core'));
    await mkdir(join(project, 'vue'));
    await writeFile(join(project, 'vue/notes.md'), 'preserved');
    const result = await switchUi({ solution: undefined, cwd: join(project, 'vue') });
    expect(result.frontend).toBe(join(project, 'vue'));
    expect(await readFile(join(project, 'vue.bak/notes.md'), 'utf8')).toBe('preserved');
  });

  it.each(['aspnet-core', 'aspnet-core/frontend', '.', '../outside'])(
    'rejects a frontend directory that would overwrite or escape the project: %s',
    async dir => {
      const project = join(root, 'Separated');
      const backend = join(project, 'aspnet-core');
      await writeSolutionFixture(backend);
      await expect(switchUi({ solution: project, cwd: project, dir })).rejects.toThrow(CliError);
      await expect(stat(join(backend, 'Acme.BookStore.slnx'))).resolves.toBeDefined();
    },
  );
});
