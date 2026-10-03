import { join } from 'node:path';
import { CliError } from '../errors.js';
import { BACKEND_DIRECTORY } from './layout.js';

/**
 * The flags `abpv new` reads itself, and whether each one takes a value. Everything else
 * on the command line belongs to the official CLI. Output options are adjusted to keep
 * the backend and frontend in separate directories.
 */
export const NEW_FLAGS: Record<string, boolean> = {
  backend: true,
  dir: true,
  'dry-run': false,
  modules: true,
  'no-backend': false,
  'package-manager': true,
  port: true,
  'sample-crud': false,
  'skip-install': false,
  'skip-proxy': false,
  template: true,
  'with-source-code': true,
};

export interface SplitArgs {
  /** The solution name, which comes first exactly as `abp new` wants it. */
  name: string;
  /** What goes to `abp new` untouched. */
  passthrough: string[];
  /**
   * This command's own flags as they were typed: the value for the ones that take one,
   * `true` for the rest. Read here rather than from the parsed arguments because a parser
   * reads `--no-backend` as `backend: false`, which is a different flag with a value the
   * caller never wrote.
   */
  flags: Record<string, string | boolean>;
}

/**
 * Separates this command's own flags from the official CLI's. Nothing is reconstructed
 * from a parsed value: what was typed is what is passed on, spelling included.
 *
 * @param rawArgs The command line after `abpv new`
 * @param flags The flags this command owns, and whether they take a value
 */
export function splitArgs(
  rawArgs: readonly string[],
  flags: Record<string, boolean> = NEW_FLAGS,
): SplitArgs {
  const [name, ...rest] = rawArgs;

  if (!name || name.startsWith('-')) {
    throw new CliError('The solution name comes first: abpv new Acme.BookStore [options...].');
  }

  const passthrough: string[] = [];
  const own: Record<string, string | boolean> = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index] as string;
    const [flag = '', inlineValue] = token.startsWith('--')
      ? (token.slice(2).split('=', 2) as [string, string?])
      : ['', undefined];

    if (!(flag in flags)) {
      passthrough.push(token);
      continue;
    }

    if (!flags[flag]) {
      own[flag] = true;
      continue;
    }

    // A value written apart from its flag is a second token, and it is not the CLI's.
    own[flag] = inlineValue ?? rest[index + 1] ?? '';
    if (inlineValue === undefined) index += 1;
  }

  return { name, passthrough, flags: own };
}

const has = (args: readonly string[], ...names: string[]): boolean =>
  args.some(arg => names.includes(arg) || names.some(name => arg.startsWith(`${name}=`)));

function outputOptions(name: string, passthrough: readonly string[]) {
  let directory = name;
  const forwarded: string[] = [];

  for (let index = 0; index < passthrough.length; index += 1) {
    const token = passthrough[index] as string;
    const equals = token.indexOf('=');
    const flag = equals < 0 ? token : token.slice(0, equals);
    const inline = equals < 0 ? undefined : token.slice(equals + 1);

    if (flag === '-o' || flag === '--output-folder') {
      const value = inline ?? passthrough[++index];
      if (!value || value.startsWith('-')) {
        throw new CliError(`${flag} needs the project output directory. Use -o Acme.BookStore.`);
      }
      directory = value;
    } else if (flag === '-csf' || flag === '--create-solution-folder') {
      if (inline === undefined && /^(true|false)$/i.test(passthrough[index + 1] ?? '')) {
        index += 1;
      }
    } else {
      forwarded.push(token);
    }
  }

  return { directory, forwarded };
}

export function newProjectDirectory(name: string, passthrough: readonly string[]): string {
  return outputOptions(name, passthrough).directory;
}

/**
 * The command line the official CLI is called with. `-u no-ui` is not negotiable: the UI
 * is what this command generates, and any other value would leave a second one behind.
 *
 * @param name The solution name
 * @param passthrough Everything the caller wrote that this CLI does not read itself
 */
export function abpNewArgs(name: string, passthrough: readonly string[]): string[] {
  if (has(passthrough, '-u', '--ui-framework')) {
    throw new CliError(
      'The UI is what this command generates, so -u is not passed through. Drop it, or run ' +
        '`abp new` yourself and then `abpv switch-ui`.',
    );
  }

  const { directory, forwarded } = outputOptions(name, passthrough);

  return [
    'new',
    name,
    // The layered application solution, unless the caller asked for another template.
    ...(has(passthrough, '-t', '--template') ? [] : ['-t', 'app']),
    '-u',
    'no-ui',
    // Without it a machine with a commercial subscription produces the commercial variant.
    ...(has(passthrough, '-uost', '--use-open-source-template') ? [] : ['-uost']),
    '-o',
    join(directory, BACKEND_DIRECTORY),
    ...forwarded,
  ];
}
