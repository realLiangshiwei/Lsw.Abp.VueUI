import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runProxy, type ProxyArgs } from './proxy.js';
import { readProxyConfig } from '../config/proxy-config.js';

const FIXTURES = resolve(import.meta.dirname, '../../../../e2e/fixtures');
const projects: string[] = [];

async function project(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'abpvue-cli-'));
  projects.push(directory);

  return directory;
}

afterEach(async () => {
  await Promise.all(
    projects.splice(0).map(directory => rm(directory, { recursive: true, force: true })),
  );
});

/** Offline on purpose: what the commands do is the same whatever answered. */
function args(cwd: string, extra: Partial<ProxyArgs> = {}): ProxyArgs {
  return {
    cwd,
    target: 'src/proxy',
    source: join(FIXTURES, 'api-definition.json'),
    'config-source': join(FIXTURES, 'application-configuration.json'),
    ...extra,
  };
}

async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });

  return entries
    .filter(entry => entry.isFile())
    .map(entry =>
      join(entry.parentPath, entry.name)
        .slice(directory.length + 1)
        .split(sep)
        .join('/'),
    )
    .sort();
}

describe('proxy add', () => {
  it('writes the module and records what it wrote', async () => {
    const cwd = await project();

    const result = await runProxy('add', args(cwd, { module: 'identity' }));
    const config = await readProxyConfig(join(cwd, 'src/proxy'));

    expect(result.modules).toEqual(['identity']);
    expect(config.modules).toEqual({
      identity: { rootPath: 'identity', remoteServiceName: 'AbpIdentity' },
    });
    expect(config.generated).toEqual(
      await filesIn(join(cwd, 'src/proxy')).then(files =>
        files.filter(file => file !== 'generate-proxy.json'),
      ),
    );
  });

  it('keeps the modules that are already there', async () => {
    const cwd = await project();

    await runProxy('add', args(cwd, { module: 'identity' }));
    const result = await runProxy('add', args(cwd, { module: 'account' }));

    expect(result.modules).toEqual(['account', 'identity']);
    expect(await filesIn(join(cwd, 'src/proxy'))).toContain(
      'volo/abp/identity/identity-user.service.ts',
    );
  });

  it('generates the validators of the object extensions when it has the configuration', async () => {
    const cwd = await project();

    await runProxy('add', args(cwd, { module: 'identity' }));

    const validators = await readFile(
      join(cwd, 'src/proxy/object-extension-validators.ts'),
      'utf8',
    );
    expect(validators).toContain('identityUserExtensionValidators');
  });

  it('says what it is leaving out when it has no configuration to read', async () => {
    const cwd = await project();

    const result = await runProxy(
      'add',
      args(cwd, { module: 'identity', 'config-source': undefined }),
    );

    expect(result.report.of('skipped').join(' ')).toMatch(/--config-source/);
    expect(await filesIn(join(cwd, 'src/proxy'))).not.toContain('object-extension-validators.ts');
  });

  it('writes nothing on a dry run', async () => {
    const cwd = await project();

    const result = await runProxy('add', args(cwd, { module: 'identity', 'dry-run': true }));

    expect(result.written.length).toBeGreaterThan(0);
    await expect(readdir(join(cwd, 'src/proxy')).catch(() => 'nothing')).resolves.toBe('nothing');
  });

  it('says which modules there are when asked for one that is not there', async () => {
    const cwd = await project();

    await expect(runProxy('add', args(cwd, { module: 'nope' }))).rejects.toThrow(/identity/);
  });
});

describe('proxy refresh', () => {
  it('changes nothing when nothing changed', async () => {
    const cwd = await project();
    await runProxy('add', args(cwd, { module: 'identity,account' }));

    const before = await Promise.all(
      (await filesIn(join(cwd, 'src/proxy'))).map(async file => [
        file,
        await readFile(join(cwd, 'src/proxy', file), 'utf8'),
      ]),
    );

    await runProxy('refresh', args(cwd));

    const after = await Promise.all(
      (await filesIn(join(cwd, 'src/proxy'))).map(async file => [
        file,
        await readFile(join(cwd, 'src/proxy', file), 'utf8'),
      ]),
    );

    expect(after).toEqual(before);
  });

  it('reuses the backend the last generation recorded', async () => {
    const cwd = await project();
    await runProxy('add', args(cwd, { module: 'identity', url: 'https://recorded' }));

    const config = await readProxyConfig(join(cwd, 'src/proxy'));

    expect(config.source.url).toBe('https://recorded');
  });
});

describe('proxy remove', () => {
  it('takes the module away and leaves the others generated', async () => {
    const cwd = await project();
    await runProxy('add', args(cwd, { module: 'identity,settingManagement' }));

    const result = await runProxy('remove', args(cwd, { module: 'settingManagement' }));
    const files = await filesIn(join(cwd, 'src/proxy'));

    expect(result.modules).toEqual(['identity']);
    expect(files).toContain('volo/abp/identity/identity-user.service.ts');
    expect(files.some(file => file.includes('setting-management'))).toBe(false);
  });

  it('leaves nothing behind when the last module goes', async () => {
    const cwd = await project();
    await runProxy('add', args(cwd, { module: 'identity' }));

    await runProxy('remove', args(cwd, { module: 'identity' }));

    expect(await filesIn(join(cwd, 'src/proxy'))).toEqual([]);
  });

  it('needs to be told which module', async () => {
    const cwd = await project();
    await runProxy('add', args(cwd, { module: 'identity' }));

    await expect(runProxy('remove', args(cwd))).rejects.toThrow(/identity/);
  });
});

describe('the backend it talks to', () => {
  it('comes from the application configuration when no flag says otherwise', async () => {
    const cwd = await project();
    await mkdir(join(cwd, 'public'), { recursive: true });
    await writeFile(
      join(cwd, 'public/dynamic-env.json'),
      '{ "apis": { "default": { "url": "https://inferred" } } }',
      'utf8',
    );

    await runProxy('add', args(cwd, { module: 'identity' }));

    const config = await readProxyConfig(join(cwd, 'src/proxy'));
    expect(config.source.url).toBe('https://inferred');
  });
});
