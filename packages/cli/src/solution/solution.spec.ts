import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CliError } from '../errors.js';
import { configureBackend } from './backend-config.js';
import { findSolutionRoot, readSolution } from './locate.js';
import { writeSolutionFixture } from './solution-fixture.js';

describe('a generated solution', () => {
  let dir: string;
  let root: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'abpvue-solution-'));
    root = join(dir, 'Acme.BookStore');
    await writeSolutionFixture(root);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const settings = async (project: string) =>
    JSON.parse(
      await readFile(join(root, 'src', `Acme.BookStore.${project}`, 'appsettings.json'), 'utf8'),
    ) as Record<string, Record<string, unknown>>;

  it('is found one directory down, which is where -csf puts it', async () => {
    expect(await findSolutionRoot(dir, 'Acme.BookStore')).toBe(root);
  });

  it('says so when there is no solution anywhere below', async () => {
    await expect(findSolutionRoot(join(dir, 'src'))).rejects.toThrow(CliError);
  });

  it('reads the name, the address and the client the frontend is meant to use', async () => {
    const solution = await readSolution(root);

    expect(solution).toMatchObject({
      name: 'Acme.BookStore',
      appName: 'BookStore',
      hostUrl: 'https://localhost:44335',
      authUrl: 'https://localhost:44335',
      clientId: 'BookStore_App',
    });
  });

  it('takes the identity server from its own project when the solution was separated', async () => {
    await writeSolutionFixture(root, { separateAuthServer: true });

    expect((await readSolution(root)).authUrl).toBe('https://localhost:44336');
  });

  it('gives the client the redirect URIs it was generated without', async () => {
    await configureBackend({
      solution: await readSolution(root),
      appUrl: 'http://localhost:4200',
    });

    expect((await settings('DbMigrator')).OpenIddict).toMatchObject({
      Applications: {
        BookStore_App: { ClientId: 'BookStore_App', RootUrl: 'http://localhost:4200' },
      },
    });
  });

  it('creates the CORS section a no-ui solution does not have', async () => {
    await configureBackend({
      solution: await readSolution(root),
      appUrl: 'http://localhost:4200',
    });

    expect((await settings('HttpApi.Host')).App).toMatchObject({
      SelfUrl: 'https://localhost:44335',
      CorsOrigins: 'http://localhost:4200',
    });
  });

  it('adds to the lists a solution already has rather than replacing them', async () => {
    const path = join(root, 'src', 'Acme.BookStore.HttpApi.Host', 'appsettings.json');
    await writeFile(
      path,
      '{\n  "App": {\n    // kept\n    "CorsOrigins": "https://acme.io",\n    "RedirectAllowedUrls": "https://acme.io"\n  }\n}\n',
      'utf8',
    );

    await configureBackend({
      solution: await readSolution(root),
      appUrl: 'http://localhost:4200',
    });
    const text = await readFile(path, 'utf8');

    expect(text).toContain('"CorsOrigins": "https://acme.io,http://localhost:4200"');
    expect(text).toContain('"RedirectAllowedUrls": "https://acme.io,http://localhost:4200"');
    // An AST level edit, so what was around the value is still there (design 08 §4, S3).
    expect(text).toContain('// kept');
  });

  it('leaves RedirectAllowedUrls alone when the solution has no such key', async () => {
    await configureBackend({
      solution: await readSolution(root),
      appUrl: 'http://localhost:4200',
    });

    expect((await settings('HttpApi.Host')).App).not.toHaveProperty('RedirectAllowedUrls');
  });

  it('says what it would change without changing it', async () => {
    const solution = await readSolution(root);
    const edits = await configureBackend({
      solution,
      appUrl: 'http://localhost:4200',
      dryRun: true,
    });

    expect(edits.map(edit => `${edit.file} ${edit.key}`)).toEqual([
      join('src', 'Acme.BookStore.DbMigrator', 'appsettings.json') +
        ' OpenIddict:Applications:BookStore_App:RootUrl',
      join('src', 'Acme.BookStore.HttpApi.Host', 'appsettings.json') + ' App:CorsOrigins',
    ]);
    expect((await settings('DbMigrator')).OpenIddict).not.toHaveProperty(
      'Applications.BookStore_App.RootUrl',
    );
  });

  it('changes nothing on a second run', async () => {
    const solution = await readSolution(root);
    await configureBackend({ solution, appUrl: 'http://localhost:4200' });

    expect(await configureBackend({ solution, appUrl: 'http://localhost:4200' })).toEqual([]);
  });

  it('keeps a copy of what it changed when asked to', async () => {
    await configureBackend({
      solution: await readSolution(root),
      appUrl: 'http://localhost:4200',
      backup: true,
    });

    const files = await readdir(join(root, 'src', 'Acme.BookStore.HttpApi.Host'));

    expect(files.filter(name => name.endsWith('.bak'))).toHaveLength(1);
  });
});
