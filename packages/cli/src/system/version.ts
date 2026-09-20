import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CliError } from '../errors.js';

const PACKAGE = '@lsw-abpvue/cli';

/**
 * The CLI's own version, which is what a project it creates depends on. Found by walking
 * up from this module, because where it sits differs between a bundled install and a
 * checkout of the repository.
 */
export function cliVersion(): string {
  let dir = dirname(fileURLToPath(import.meta.url));

  for (let depth = 0; depth < 5; depth += 1) {
    try {
      const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
        name?: string;
        version?: string;
      };

      if (manifest.name === PACKAGE && manifest.version) return manifest.version;
    } catch {
      // Not this directory's; keep walking up.
    }

    dir = dirname(dir);
  }

  throw new CliError(`This installation of ${PACKAGE} has no readable package.json.`);
}
