import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join, posix, relative } from 'node:path';
import { applyEdits, modify, type FormattingOptions } from 'jsonc-parser';
import { CliError } from '../errors.js';
import { copyDirectory } from '../system/files.js';
import type { Rollback } from '../system/rollback.js';
import { entriesOf, type PackageManifest, type SourceEntry } from './entries.js';
import { readSourceCodeRecord, writeSourceCodeRecord, type ReleasedPackage } from './record.js';

/**
 * The layers `--with-source-code all` leaves on npm. They are replaced through dependency
 * injection rather than by editing -- a host swaps a service, a component or a whole page
 * with one provider -- so taking their source is a cost with nothing bought. Naming one
 * of them explicitly still releases it.
 */
const FRAMEWORK = [
  '@lsw-abpvue/cli',
  '@lsw-abpvue/components',
  '@lsw-abpvue/core',
  '@lsw-abpvue/oauth',
  '@lsw-abpvue/theme-basic',
  '@lsw-abpvue/theme-shared',
  '@lsw-abpvue/utils',
];

/** Where released packages live, as both the copy and the tsconfig paths spell it. */
const PACKAGES_DIR = 'packages';

export interface ReleaseOptions {
  /** The application root: where `package.json`, `tsconfig.json` and `node_modules` are. */
  project: string;
  /** Package names, or `all` for every module UI the project depends on. */
  packages: readonly string[];
  dryRun?: boolean | undefined;
  rollback?: Rollback | undefined;
}

export interface ReleaseResult {
  released: ReleasedPackage[];
  /** The tsconfig paths that now shadow the npm packages. */
  paths: Record<string, string[]>;
  /** What the released sources import and the project did not depend on itself. */
  added: Record<string, string>;
  /** Asked for, but not installed. */
  missing: string[];
}

async function readManifest(path: string): Promise<PackageManifest | undefined> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as PackageManifest;
  } catch {
    return undefined;
  }
}

/** Every `@lsw-abpvue/*` the project depends on, whichever group it is declared in. */
function workspacePackagesOf(manifest: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}): string[] {
  return [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ]
    .filter(name => name.startsWith('@lsw-abpvue/'))
    .sort();
}

/** The packages `--list-source-ready` prints, and what `all` expands to. */
export async function releasablePackages(project: string): Promise<string[]> {
  const manifest = (await readManifest(join(project, 'package.json'))) as
    { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | undefined;

  if (!manifest) throw new CliError(`${project} has no package.json, so it is not a project.`);

  return workspacePackagesOf(manifest).filter(name => !FRAMEWORK.includes(name));
}

/** ABP's appsettings and this template's tsconfig are both two-space; keep what is there. */
function formattingOf(text: string): FormattingOptions {
  const indent = /\n([ \t]+)"/.exec(text)?.[1] ?? '  ';

  return {
    insertSpaces: !indent.startsWith('\t'),
    tabSize: indent.length,
    eol: text.includes('\r\n') ? '\r\n' : '\n',
  };
}

/**
 * Adds the paths that shadow the npm packages. The application's own imports do not
 * change, because the package name does not: that is what `tsconfig.paths` is for, and it
 * is how the ABP CLI has released Angular sources all along (design 08 §5).
 */
async function shadowInTsconfig(
  project: string,
  paths: Record<string, string[]>,
  rollback: Rollback | undefined,
): Promise<void> {
  const path = join(project, 'tsconfig.json');
  const original = await readFile(path, 'utf8').catch(() => undefined);

  if (original === undefined) {
    throw new CliError(`${project} has no tsconfig.json, so there is nothing to shadow through.`);
  }

  let text = original;
  for (const [specifier, targets] of Object.entries(paths)) {
    text = applyEdits(
      text,
      modify(text, ['compilerOptions', 'paths', specifier], targets, {
        formattingOptions: formattingOf(text),
      }),
    );
  }

  rollback?.add('put tsconfig.json back as it was', () => writeFile(path, original, 'utf8'));
  await writeFile(path, text, 'utf8');
}

async function locate(project: string, name: string): Promise<string | undefined> {
  const path = join(project, 'node_modules', name);

  return stat(path).then(
    () => path,
    () => undefined,
  );
}

/**
 * The dependencies a released package brought with it, added to the project's own. A
 * package's dependencies live under the package, and released source sits outside it --
 * with pnpm's layout `packages/theme-basic` cannot see the `reka-ui` that
 * `node_modules/@lsw-abpvue/theme-basic` was installed with. The project has to depend on
 * them itself for the source to resolve.
 */
async function addDependencies(
  project: string,
  manifests: readonly PackageManifest[],
  rollback: Rollback | undefined,
): Promise<Record<string, string>> {
  const path = join(project, 'package.json');
  const original = await readFile(path, 'utf8');
  const declared = JSON.parse(original) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const has = (name: string): boolean =>
    name in (declared.dependencies ?? {}) || name in (declared.devDependencies ?? {});

  const added: Record<string, string> = {};
  let text = original;

  for (const manifest of manifests) {
    for (const [name, range] of Object.entries(manifest.dependencies ?? {})) {
      if (has(name) || name in added) continue;

      added[name] = range;
      text = applyEdits(
        text,
        modify(text, ['dependencies', name], range, {
          formattingOptions: formattingOf(text),
        }),
      );
    }
  }

  if (Object.keys(added).length === 0) return added;

  rollback?.add('put package.json back as it was', () => writeFile(path, original, 'utf8'));
  await writeFile(path, text, 'utf8');

  return added;
}

/**
 * Copies a package's sources into the project and points the compiler and the bundler at
 * them. The npm package itself stays in `dependencies`: the path shadows it, and leaving
 * it there costs nothing.
 *
 * @param options Which packages, and which project to put them in
 */
export async function releaseSourceCode(options: ReleaseOptions): Promise<ReleaseResult> {
  const { project } = options;
  // `all` expands where it stands rather than replacing the list: `all,@lsw-abpvue/theme-basic`
  // means the module UIs and the theme, not the module UIs alone.
  const asked = options.packages.includes('all')
    ? [
        ...new Set([
          ...(await releasablePackages(project)),
          ...options.packages.filter(name => name !== 'all'),
        ]),
      ]
    : options.packages;

  const record = await readSourceCodeRecord(project);
  const released: ReleasedPackage[] = [];
  const manifests: PackageManifest[] = [];
  const paths: Record<string, string[]> = {};
  const missing: string[] = [];

  for (const name of asked) {
    const installed = await locate(project, name);
    const manifest = installed ? await readManifest(join(installed, 'package.json')) : undefined;

    if (!installed || !manifest) {
      missing.push(name);
      continue;
    }

    const short = name.slice(name.indexOf('/') + 1);
    const target = join(project, PACKAGES_DIR, short);
    const entries: SourceEntry[] = entriesOf(manifest);

    for (const entry of entries) {
      // Forward slashes whatever the platform writes, and relative: without `baseUrl` --
      // deprecated in TypeScript 6 -- a bare path is refused outright.
      paths[entry.specifier] = [`./${posix.join(PACKAGES_DIR, short, entry.file)}`];
    }

    if (!options.dryRun) {
      for (const directory of new Set(entries.map(entry => entry.directory))) {
        const from = join(installed, directory);
        if (!(await stat(from).catch(() => undefined))) {
          throw new CliError(
            `${name} does not ship ${directory}, so its source cannot be released. ` +
              'It was published without it.',
          );
        }

        await copyDirectory(from, join(target, directory));
      }

      options.rollback?.add(`removed ${relative(project, target)}`, () =>
        rm(target, { recursive: true, force: true }),
      );
    }

    manifests.push(manifest);
    released.push({
      name,
      version: manifest.version ?? '0.0.0',
      path: posix.join(PACKAGES_DIR, short),
      releasedAt: new Date().toISOString(),
    });
  }

  if (options.dryRun || released.length === 0) return { released, paths, added: {}, missing };

  await shadowInTsconfig(project, paths, options.rollback);
  const added = await addDependencies(project, manifests, options.rollback);

  for (const entry of released) record.packages[entry.name] = entry;
  await writeSourceCodeRecord(project, record);

  return { released, paths, added, missing };
}
