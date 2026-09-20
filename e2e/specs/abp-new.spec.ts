import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Off by default: it downloads a solution template from get.abp.io twice and takes
 * minutes. `ABPVUE_E2E_ABP=1 pnpm test` runs it, and it is the answer to the M8 stop-loss
 * question -- whether wrapping the official CLI leaves what it produces alone.
 */
const ENABLED = process.env.ABPVUE_E2E_ABP === '1';

const NAME = 'Byte.Identical';
const OPTIONS = ['-d', 'mongodb'];
const CLI = fileURLToPath(new URL('../../packages/cli/dist/bin.js', import.meta.url));

/**
 * What `abp new` picks anew on every run. Two runs of the same command differ in 23 files
 * without this, so "identical" can only ever mean "identical apart from these".
 */
const RANDOM: [RegExp, string][] = [
  [/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'GUID'],
  [/"creationTime": "[^"]+"/g, '"creationTime": "TIME"'],
  [/localhost:\d{4,5}/g, 'localhost:PORT'],
  [/"sslPort": \d+/g, '"sslPort": PORT'],
  [/"DefaultPassPhrase": "[^"]+"/g, '"DefaultPassPhrase": "PASS"'],
];

/** Build output, the frontend this CLI adds, and what a run of the solution leaves. */
const IGNORED = new Set(['bin', 'obj', 'vue', 'wwwroot', 'Logs']);

/** The files `abpv new` is meant to change, and the only ones allowed to differ. */
const CONFIGURED = [
  join('src', `${NAME}.DbMigrator`, 'appsettings.json'),
  join('src', `${NAME}.HttpApi.Host`, 'appsettings.json'),
];

const normalise = (text: string): string =>
  RANDOM.reduce((body, [pattern, value]) => body.replace(pattern, value), text);

function execute(command: string, args: string[], cwd: string): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', resolve);
  });
}

async function filesOf(root: string, prefix = ''): Promise<string[]> {
  const files: string[] = [];

  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;

    const path = prefix ? join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) files.push(...(await filesOf(root, path)));
    else files.push(path);
  }

  return files.sort();
}

describe.skipIf(!ENABLED)('the backend abpv new leaves behind', () => {
  it('is the one abp new produces on its own, apart from the configuration', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'abpvue-identical-'));
    const official = join(dir, 'official');
    const wrapped = join(dir, 'wrapped');
    await mkdir(official);
    await mkdir(wrapped);

    try {
      const abp = ['new', NAME, '-t', 'app', '-u', 'no-ui', '-uost', '-csf', ...OPTIONS];
      expect(await execute('abp', abp, official)).toBe(0);

      const abpv = ['new', NAME, ...OPTIONS, '--skip-install', '--skip-proxy'];
      expect(await execute(process.execPath, [CLI, ...abpv], wrapped)).toBe(0);

      const left = join(official, NAME);
      const right = join(wrapped, NAME);

      expect(await filesOf(right)).toEqual(await filesOf(left));

      const differing: string[] = [];
      for (const path of await filesOf(left)) {
        const [a, b] = await Promise.all([
          readFile(join(left, path), 'utf8'),
          readFile(join(right, path), 'utf8'),
        ]);

        if (normalise(a) !== normalise(b)) differing.push(path);
      }

      expect(differing).toEqual(CONFIGURED);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 900_000);
});
