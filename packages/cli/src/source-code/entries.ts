import { basename } from 'node:path';

/** One entry point of a package: what it is imported as, and where its source is. */
export interface SourceEntry {
  /** What an application imports: `@lsw-abpvue/identity`, `@lsw-abpvue/identity/config`. */
  specifier: string;
  /** The directory to copy, relative to the package: `src`, `config/src`. */
  directory: string;
  /** The file a tsconfig path points at, relative to the copied package. */
  file: string;
}

export interface PackageManifest {
  name: string;
  version?: string | undefined;
  dependencies?: Record<string, string> | undefined;
  exports?: Record<string, unknown> | undefined;
}

/**
 * Where a subpath's source lives, by the convention of design 03 §2: `.` is
 * `src/index.ts` and `./config` is `config/src/index.ts`. A stylesheet has no entry point
 * of its own -- its source sits in `src/styles` under the name it is published as.
 */
function sourceOf(subpath: string, target: unknown): Omit<SourceEntry, 'specifier'> {
  if (typeof target === 'string' && target.endsWith('.css')) {
    return { directory: 'src', file: `src/styles/${basename(target)}` };
  }

  const segment = subpath === '.' ? '' : `${subpath.slice(2)}/`;

  return { directory: `${segment}src`, file: `${segment}src/index.ts` };
}

/**
 * The entry points of a package, read from its own `exports` map rather than assumed,
 * which is what makes this work for a package with three entry points and one with a
 * stylesheet alike.
 *
 * @param manifest The package's `package.json`
 */
export function entriesOf(manifest: PackageManifest): SourceEntry[] {
  return Object.entries(manifest.exports ?? {})
    .filter(([subpath]) => subpath !== './package.json')
    .map(([subpath, target]) => ({
      specifier: subpath === '.' ? manifest.name : `${manifest.name}/${subpath.slice(2)}`,
      ...sourceOf(subpath, target),
    }));
}
