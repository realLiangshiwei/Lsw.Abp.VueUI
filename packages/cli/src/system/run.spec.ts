import process from 'node:process';
import { describe, expect, it } from 'vitest';
import { run, versionOf } from './run.js';

describe('run', () => {
  it('waits for the program and hands back what it wrote', async () => {
    const result = await run(process.execPath, ['-e', 'console.log("hello")']);

    expect(result).toEqual({ code: 0, output: 'hello\n' });
  });

  it('reads what a program writes to stderr as well', async () => {
    const result = await run(process.execPath, ['-e', 'console.error("bad"); process.exit(3)']);

    expect(result).toEqual({ code: 3, output: 'bad\n' });
  });

  it('rejects when there is no such program, rather than reporting a failed run', async () => {
    await expect(run('abpvue-no-such-program', [])).rejects.toThrow();
  });
});

describe('versionOf', () => {
  it('is what the program says', async () => {
    expect(await versionOf(process.execPath, ['--version'])).toBe(process.version);
  });

  it('is nothing at all when the program is not installed', async () => {
    expect(await versionOf('abpvue-no-such-program', ['--version'])).toBeNull();
  });
});
