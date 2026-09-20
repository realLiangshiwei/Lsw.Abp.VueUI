import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CliError } from '../errors.js';
import { NEW_FLAGS } from '../solution/abp-cli.js';
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
