import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checks = [
  ['lint'],
  ['typecheck'],
  ['test:coverage'],
  ['build'],
  ['--filter', 'playground', 'bench:build'],
  ['size'],
  ['check:published-types'],
  ['check:resolution'],
  ['check:external-install'],
  ['check:source-code-release'],
  ['check:create-lib'],
];

export function verifyRelease(root = repoRoot) {
  for (const args of checks) {
    console.log(`Release verification: pnpm ${args.join(' ')}`);
    const result = spawnSync('pnpm', args, {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Release check failed: pnpm ${args.join(' ')}. Publication stopped.`);
    }
  }
  console.log('Release verification passed.');
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length > 2) throw new Error('Usage: pnpm verify:release');
    verifyRelease();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
