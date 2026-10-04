import type * as NodePath from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { abpNewArgs } from './abp-cli.js';

vi.mock('node:path', async importOriginal => {
  const path = await importOriginal<typeof NodePath>();
  return { ...path, ...path.win32 };
});

describe('backend output paths on Windows', () => {
  it('uses the native separator for the default project directory', () => {
    expect(abpNewArgs('Acme.BookStore', [])).toContain('Acme.BookStore\\aspnet-core');
  });

  it.each([
    ['-o', '../solutions'],
    ['--output-folder', '../solutions'],
    ['--output-folder=../solutions'],
    ['-o=../solutions'],
  ])('keeps the backend inside the explicit project directory: %j', (...flags) => {
    expect(abpNewArgs('Acme.BookStore', flags)).toContain('..\\solutions\\aspnet-core');
  });

  it('passes an absolute directory with spaces as one argument', () => {
    const args = abpNewArgs('Acme.BookStore', ['-o', 'C:\\projects\\Vue Demo']);
    expect(args[args.indexOf('-o') + 1]).toBe('C:\\projects\\Vue Demo\\aspnet-core');
    expect(args.filter(arg => arg === '-o')).toHaveLength(1);
  });
});
