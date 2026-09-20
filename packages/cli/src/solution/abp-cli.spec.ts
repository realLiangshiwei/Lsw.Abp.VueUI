import { describe, expect, it } from 'vitest';
import { CliError } from '../errors.js';
import { abpNewArgs, splitArgs } from './abp-cli.js';

describe('splitArgs', () => {
  it('takes the solution name from the front, as abp new wants it', () => {
    expect(splitArgs(['Acme.BookStore']).name).toBe('Acme.BookStore');
  });

  it('refuses a command line that starts with a flag', () => {
    expect(() => splitArgs(['-d', 'ef', 'Acme.BookStore'])).toThrow(CliError);
  });

  it('hands everything it does not read itself to the official CLI, spelling included', () => {
    const { passthrough } = splitArgs([
      'Acme.BookStore',
      '-d',
      'mongodb',
      '--separate-auth-server',
      '--database-management-system=mysql',
    ]);

    expect(passthrough).toEqual([
      '-d',
      'mongodb',
      '--separate-auth-server',
      '--database-management-system=mysql',
    ]);
  });

  it('reads its own flags as they were typed, values and all', () => {
    // A parser reads `--no-backend` as `backend: false`, which is a different flag with a
    // value nobody wrote -- and it takes the real `--backend` down with it.
    const { flags } = splitArgs(['Acme.BookStore', '--no-backend', '--backend', 'https://x']);

    expect(flags).toEqual({ 'no-backend': true, backend: 'https://x' });
  });

  it('reads a value written with an equals sign the same way', () => {
    expect(splitArgs(['X', '--dir=frontend', '--dry-run']).flags).toEqual({
      dir: 'frontend',
      'dry-run': true,
    });
  });

  it('keeps its own flags, whichever way their value was written', () => {
    const { passthrough } = splitArgs([
      'Acme.BookStore',
      '--port',
      '5173',
      '--dir=frontend',
      '--skip-install',
      '-d',
      'ef',
    ]);

    expect(passthrough).toEqual(['-d', 'ef']);
  });
});

describe('abpNewArgs', () => {
  it('is the official command line with the three fixed choices added', () => {
    expect(abpNewArgs('Acme.BookStore', ['-d', 'mongodb'])).toEqual([
      'new',
      'Acme.BookStore',
      '-t',
      'app',
      '-u',
      'no-ui',
      '-uost',
      '-csf',
      '-d',
      'mongodb',
    ]);
  });

  it('leaves the template alone when the caller chose one', () => {
    expect(abpNewArgs('X', ['-t', 'app-nolayers'])).not.toContain('app');
    expect(abpNewArgs('X', ['--template=microservice']).join(' ')).toContain(
      '--template=microservice',
    );
  });

  it('adds neither flag twice', () => {
    const args = abpNewArgs('X', ['-uost', '-csf']);

    expect(args.filter(arg => arg === '-uost')).toHaveLength(1);
    expect(args.filter(arg => arg === '-csf')).toHaveLength(1);
  });

  it('leaves the output folder to the caller who named one', () => {
    expect(abpNewArgs('X', ['-o', '../solutions'])).not.toContain('-csf');
  });

  it('refuses to pass a UI through, since the UI is what it generates', () => {
    expect(() => abpNewArgs('X', ['-u', 'angular'])).toThrow(CliError);
  });
});
