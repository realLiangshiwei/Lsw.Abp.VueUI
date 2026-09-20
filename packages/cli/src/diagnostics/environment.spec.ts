import { describe, expect, it } from 'vitest';
import { checkEnvironment } from './environment.js';

const statusOf = (checks: Awaited<ReturnType<typeof checkEnvironment>>, name: string) =>
  checks.find(check => check.name === name)?.status;

describe('checkEnvironment', () => {
  it('has nothing to say about .NET when no backend is involved', async () => {
    const checks = await checkEnvironment({ backend: false });

    expect(checks.map(check => check.name)).toEqual(['node']);
    expect(statusOf(checks, 'node')).toBe('ok');
  });

  it('says which package manager is missing, and how to get it', async () => {
    const checks = await checkEnvironment({
      backend: false,
      packageManager: 'abpvue-no-such-program',
    });

    expect(statusOf(checks, 'abpvue-no-such-program')).toBe('fail');
    expect(checks.at(-1)?.fix).toContain('npm install -g');
  });
});
