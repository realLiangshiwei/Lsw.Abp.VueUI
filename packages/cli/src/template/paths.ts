import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CliError } from '../errors.js';

/**
 * Where a template is, in the order the two ways of running the CLI put it: bundled
 * beside the build when it was installed from npm, and in the repository when it runs
 * from source. The second candidate is for the case where the bundler puts this module
 * in a chunk, one directory below the entry points.
 */
const CANDIDATES = ['./template/', '../template/', '../../../../templates/'];

/**
 * The directory a command renders from.
 * @param name `app` for `abpv new`, `lib` for `abpv create-lib`
 */
export function templateRoot(name: 'app' | 'lib' = 'app'): string {
  for (const candidate of CANDIDATES) {
    const path = fileURLToPath(new URL(`${candidate}${name}`, import.meta.url));
    if (existsSync(path)) return path;
  }

  throw new CliError(
    `The ${name} template is missing from this installation of the CLI. Reinstall it, or ` +
      'pass --template with a directory to render from.',
  );
}
