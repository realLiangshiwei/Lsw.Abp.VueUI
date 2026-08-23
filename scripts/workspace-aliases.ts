import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface PackageManifest {
  name?: string;
  exports?: Record<string, unknown>;
}

/**
 * Resolves every `@lsw-abpvue/*` entry point to its source file, so a host app can
 * compile the packages straight from `src` with no build step in between.
 *
 * Entry points are read from each `exports` map rather than hard-coded, and the source
 * path is derived the same way the CLI derives it when releasing source code:
 * `.` is `src/index.ts`, `./config` is `config/src/index.ts` (design 03 §2, P4).
 *
 * @param packagesRoot Absolute path of the `packages/` directory
 */
export function workspaceAliases(packagesRoot: string): Record<string, string> {
  const aliases: Record<string, string> = {};

  for (const dir of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;

    const packageDir = join(packagesRoot, dir.name);
    const manifestPath = join(packageDir, 'package.json');
    if (!existsSync(manifestPath)) continue;

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest;
    if (!manifest.name || !manifest.exports) continue;

    const subpaths = Object.keys(manifest.exports)
      .filter(subpath => !subpath.endsWith('package.json'))
      // Vite matches an alias by prefix, so `@x/identity` would swallow
      // `@x/identity/config`. Longest key first keeps the specific one winning.
      .sort((a, b) => b.length - a.length);

    for (const subpath of subpaths) {
      const segment = subpath === '.' ? '' : `${subpath.slice(2)}/`;
      const entry = resolve(packageDir, `${segment}src/index.ts`);
      if (!existsSync(entry)) continue;

      aliases[subpath === '.' ? manifest.name : `${manifest.name}/${subpath.slice(2)}`] = entry;
    }
  }

  return aliases;
}
