import { spawn } from 'node:child_process';
import process from 'node:process';

const child = spawn(
  'pnpm',
  [
    'exec',
    'vitest',
    'run',
    '--project',
    'e2e',
    'e2e/specs/generated-proxy.spec.ts',
    ...process.argv.slice(2),
  ],
  {
    cwd: new URL('../../', import.meta.url),
    stdio: 'inherit',
    env: { ...process.env, ABP_E2E_REQUIRED: '1' },
  },
);
child.on('error', error => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', code => {
  process.exitCode = code ?? 1;
});
