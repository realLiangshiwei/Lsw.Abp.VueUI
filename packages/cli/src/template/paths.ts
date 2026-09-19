import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CliError } from '../errors.js';

/**
 * Where the application template is, in the order the two ways of running the CLI put it:
 * bundled beside the build when it was installed from npm, and in the repository when it
 * runs from source. The second candidate is for the case where the bundler puts this
 * module in a chunk, one directory below the entry points.
 */
const CANDIDATES = ['./template/app', '../template/app', '../../../../templates/app'];

/** The directory `abpv new` renders a project from. */
export function templateRoot(): string {
  for (const candidate of CANDIDATES) {
    const path = fileURLToPath(new URL(candidate, import.meta.url));
    if (existsSync(path)) return path;
  }

  throw new CliError(
    'The application template is missing from this installation of the CLI. Reinstall it, or ' +
      'pass --template with a directory to render from.',
  );
}
