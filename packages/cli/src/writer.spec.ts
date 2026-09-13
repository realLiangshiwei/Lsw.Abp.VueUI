import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { OutsideTargetError, writeProxy } from './writer.js';

const directories: string[] = [];

async function target(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'abpvue-proxy-'));
  directories.push(directory);

  return directory;
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })),
  );
});

describe('writing a proxy', () => {
  it('creates the directories the paths imply', async () => {
    const directory = await target();

    await writeProxy({
      target: directory,
      files: [
        { path: 'volo/abp/identity/models.ts', content: 'export interface A { b?: string }\n' },
      ],
    });

    expect(await readFile(join(directory, 'volo/abp/identity/models.ts'), 'utf8')).toContain(
      'export interface A',
    );
  });

  it('formats what it writes, so the first run of the formatter finds nothing', async () => {
    const directory = await target();

    await writeProxy({
      target: directory,
      files: [{ path: 'models.ts', content: 'export interface A {b?:string}' }],
    });

    expect(await readFile(join(directory, 'models.ts'), 'utf8')).toBe(
      'export interface A {\n  b?: string;\n}\n',
    );
  });

  it('takes away what the last generation wrote and this one did not', async () => {
    const directory = await target();
    await mkdir(join(directory, 'volo/abp/tenant-management'), { recursive: true });
    await writeFile(
      join(directory, 'volo/abp/tenant-management/tenant.service.ts'),
      'stale',
      'utf8',
    );

    const result = await writeProxy({
      target: directory,
      files: [{ path: 'models.ts', content: 'export interface A {}\n' }],
      previous: ['volo/abp/tenant-management/tenant.service.ts', 'models.ts'],
    });

    expect(result.removed).toEqual(['volo/abp/tenant-management/tenant.service.ts']);
    expect(await readdir(directory)).toEqual(['models.ts']);
  });

  it('leaves the target directory itself alone when everything in it goes', async () => {
    const directory = await target();
    await writeFile(join(directory, 'models.ts'), 'stale', 'utf8');

    await writeProxy({ target: directory, files: [], previous: ['models.ts'] });

    expect(await readdir(directory)).toEqual([]);
  });

  it('refuses a recorded path that points out of the directory', async () => {
    const directory = await target();
    const outside = join(directory, '..', 'not-ours.ts');
    await writeFile(outside, 'keep', 'utf8');
    directories.push(outside);

    await writeProxy({ target: directory, files: [], previous: ['../not-ours.ts'] });

    expect(await readFile(outside, 'utf8')).toBe('keep');
  });

  it('refuses to write a file whose path leaves the directory', async () => {
    const directory = await target();

    await expect(
      writeProxy({ target: directory, files: [{ path: '../escaped.ts', content: 'no' }] }),
    ).rejects.toBeInstanceOf(OutsideTargetError);
  });

  it('writes nothing on a dry run, and says what it would have done', async () => {
    const directory = await target();

    const result = await writeProxy({
      target: directory,
      files: [{ path: 'models.ts', content: 'export interface A {}\n' }],
      previous: ['gone.ts'],
      dryRun: true,
    });

    expect(result).toEqual({ written: ['models.ts'], removed: ['gone.ts'] });
    expect(await readdir(directory)).toEqual([]);
  });
});
