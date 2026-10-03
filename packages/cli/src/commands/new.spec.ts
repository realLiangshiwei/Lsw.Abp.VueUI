import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as environment from '../diagnostics/environment.js';
import { CliError } from '../errors.js';
import { NEW_FLAGS } from '../solution/abp-cli.js';
import { writeSolutionFixture } from '../solution/solution-fixture.js';
import * as program from '../system/run.js';
import { templateRoot } from '../template/paths.js';
import { newCommand, runNew } from './new.js';

describe('abpv new --no-backend', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'abpvue-new-'));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  const create = (...flags: string[]) =>
    runNew(
      [
        'Acme.BookStore',
        '--no-backend',
        '--backend',
        'https://localhost:44335',
        '--skip-install',
        '--skip-proxy',
        ...flags,
      ],
      { cwd },
    );

  it('writes the application into a directory named after the solution', async () => {
    const result = await create();

    expect(result.frontend).toBe(join(cwd, 'Acme.BookStore'));
    expect(result.files).toContain('src/main.ts');
    await expect(stat(join(result.frontend, 'package.json'))).resolves.toBeDefined();
  });

  it('points it at the backend it was told about', async () => {
    const result = await create();
    const env = await readFile(join(result.frontend, 'public/dynamic-env.json'), 'utf8');

    expect(JSON.parse(env)).toMatchObject({
      apis: { default: { url: 'https://localhost:44335' } },
      oAuthConfig: { clientId: 'BookStore_App', redirectUri: 'http://localhost:4200' },
    });
  });

  it('serves the application on the port it was given', async () => {
    const result = await create('--port', '5173');

    expect(await readFile(join(result.frontend, '.env.development'), 'utf8')).toContain(
      'VITE_APP_URL=http://localhost:5173',
    );
  });

  it('wires up only the modules that were asked for', async () => {
    const result = await create('--modules', 'account,identity');
    const main = await readFile(join(result.frontend, 'src/main.ts'), 'utf8');

    expect(main).toContain('provideAccountConfig()');
    expect(main).not.toContain('provideSettingManagementConfig()');
  });

  it('refuses a module the template has never heard of', async () => {
    await expect(create('--modules', 'crm')).rejects.toThrow(CliError);
  });

  it('has nothing to configure on a backend it did not create', async () => {
    expect((await create()).edits).toEqual([]);
  });

  it('leaves nothing behind when it fails', async () => {
    // The template directory is not there, so the render fails after the directory was made.
    await expect(create('--template', 'no-such-template')).rejects.toThrow();

    await expect(stat(join(cwd, 'Acme.BookStore'))).rejects.toThrow();
  });

  it('says what it would write without writing it', async () => {
    const result = await create('--dry-run');

    expect(result.files).toContain('src/main.ts');
    await expect(stat(result.frontend)).rejects.toThrow();
  });

  it('writes a frontend-only application directly into the output directory', async () => {
    const result = await create('-o', 'custom');
    expect(result.root).toBe(join(cwd, 'custom'));
    expect(result.frontend).toBe(result.root);
    await expect(stat(join(result.frontend, 'package.json'))).resolves.toBeDefined();
    await expect(stat(join(result.root, 'aspnet-core'))).rejects.toThrow();
  });

  it('preserves an existing frontend-only application', async () => {
    const result = await create();
    await writeFile(join(result.frontend, 'notes.md'), 'mine');
    await expect(create()).rejects.toThrow(CliError);
    expect(await readFile(join(result.frontend, 'notes.md'), 'utf8')).toBe('mine');
  });
});

describe('abpv new with a backend', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'abpvue-new-backend-'));
    vi.spyOn(environment, 'checkEnvironment').mockResolvedValue([]);
    vi.spyOn(program, 'run').mockImplementation(async (_command, args) => {
      const index = args.indexOf('-o');
      const output = index < 0 ? 'Acme.BookStore' : (args[index + 1] ?? 'Acme.BookStore');
      await writeSolutionFixture(resolve(cwd, output));
      return { code: 0, output: '' };
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(cwd, { recursive: true, force: true });
  });

  const create = (...flags: string[]) =>
    runNew(['Acme.BookStore', '--skip-install', '--skip-proxy', ...flags], { cwd });

  it('creates sibling backend and frontend directories', async () => {
    const result = await create();
    const root = join(cwd, 'Acme.BookStore');
    expect(result.root).toBe(root);
    expect(result.frontend).toBe(join(root, 'vue'));
    await expect(stat(join(root, 'aspnet-core/Acme.BookStore.slnx'))).resolves.toBeDefined();
    await expect(stat(join(root, 'src'))).rejects.toThrow();
    expect(result.edits.every(edit => edit.file.startsWith('aspnet-core/'))).toBe(true);
    expect(await readFile(join(root, 'vue/public/dynamic-env.json'), 'utf8')).toContain(
      'BookStore_App',
    );
  });

  it('uses the requested output directory for the entire project', async () => {
    const result = await create('--output-folder', 'output with spaces');
    const root = join(cwd, 'output with spaces');
    expect(result.root).toBe(root);
    expect(result.frontend).toBe(join(root, 'vue'));
    await expect(stat(join(root, 'aspnet-core/Acme.BookStore.slnx'))).resolves.toBeDefined();
  });

  it('writes a custom frontend directory beside the backend', async () => {
    const result = await create('--dir', 'frontend/app');
    expect(result.frontend).toBe(join(result.root, 'frontend/app'));
    await expect(stat(join(result.root, 'aspnet-core/Acme.BookStore.slnx'))).resolves.toBeDefined();
  });

  it('previews the same output directories without calling the generator', async () => {
    const result = await create('-o', 'custom', '--dry-run');
    expect(result.root).toBe(join(cwd, 'custom'));
    expect(result.frontend).toBe(join(cwd, 'custom/vue'));
    expect(result.notes.join('\n')).toContain('custom/aspnet-core');
    expect(program.run).not.toHaveBeenCalled();
    await expect(stat(result.root)).rejects.toThrow();
  });

  it('removes a partially generated project when the official CLI fails', async () => {
    const generate = vi.mocked(program.run).getMockImplementation();
    vi.mocked(program.run).mockImplementation(async (command, args, options) => {
      await generate?.(command, args, options);
      return { code: 1, output: 'generation failed' };
    });
    await expect(create()).rejects.toThrow('abp new exited with 1');
    await expect(stat(join(cwd, 'Acme.BookStore'))).rejects.toThrow();
  });

  it('preserves existing project files when the official CLI fails', async () => {
    const root = join(cwd, 'Acme.BookStore');
    await mkdir(root);
    await writeFile(join(root, 'notes.md'), 'mine');
    const generate = vi.mocked(program.run).getMockImplementation();
    vi.mocked(program.run).mockImplementation(async (command, args, options) => {
      await generate?.(command, args, options);
      return { code: 1, output: 'generation failed' };
    });
    await expect(create()).rejects.toThrow('abp new exited with 1');
    expect(await readFile(join(root, 'notes.md'), 'utf8')).toBe('mine');
    await expect(stat(join(root, 'aspnet-core'))).rejects.toThrow();
  });

  it('preserves existing project files when a later step fails', async () => {
    const root = join(cwd, 'Acme.BookStore');
    await mkdir(root);
    await writeFile(join(root, 'notes.md'), 'mine');
    const template = join(cwd, 'invalid-template');
    await cp(templateRoot(), template, {
      recursive: true,
      filter: source => !source.includes('node_modules'),
    });
    await writeFile(join(template, 'src/App.vue'), '__UNKNOWN_VALUE__');
    await expect(create('--template', template)).rejects.toThrow('UNKNOWN_VALUE');
    expect(program.run).toHaveBeenCalled();
    expect(await readFile(join(root, 'notes.md'), 'utf8')).toBe('mine');
    await expect(stat(join(root, 'aspnet-core'))).rejects.toThrow();
  });

  it('refuses to overwrite an existing backend', async () => {
    const backend = join(cwd, 'Acme.BookStore/aspnet-core');
    await writeSolutionFixture(backend);
    await expect(create()).rejects.toThrow(CliError);
    expect(program.run).not.toHaveBeenCalled();
    await expect(stat(join(backend, 'Acme.BookStore.slnx'))).resolves.toBeDefined();
  });

  it('refuses to overwrite existing frontend files', async () => {
    const frontend = join(cwd, 'Acme.BookStore/vue');
    await mkdir(frontend, { recursive: true });
    await writeFile(join(frontend, 'notes.md'), 'mine');
    await expect(create()).rejects.toThrow(CliError);
    expect(program.run).not.toHaveBeenCalled();
    expect(await readFile(join(frontend, 'notes.md'), 'utf8')).toBe('mine');
  });

  it.each(['aspnet-core', '.', '../outside'])(
    'refuses a frontend directory that would overwrite or escape the project: %s',
    async dir => {
      await expect(create('--dir', dir)).rejects.toThrow(CliError);
      expect(program.run).not.toHaveBeenCalled();
    },
  );
});

describe('the flags abpv new owns', () => {
  it('are the ones it declares, so none is silently swallowed or passed to abp new', () => {
    const declared = Object.entries(newCommand.args ?? {})
      .filter(([, definition]) => definition.type !== 'positional')
      .map(([name, definition]) => [name, definition.type === 'string'] as const)
      .sort(([left], [right]) => (left < right ? -1 : 1));

    expect(Object.fromEntries(declared)).toEqual(NEW_FLAGS);
  });
});
