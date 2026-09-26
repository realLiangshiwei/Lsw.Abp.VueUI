import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { applyEdits, modify, type FormattingOptions } from 'jsonc-parser';
import { CliError } from '../errors.js';
import { parseRange, SCOPE } from './versions.js';

/** The three places a dependency can be declared, in the order they are looked at. */
const GROUPS = ['dependencies', 'devDependencies', 'peerDependencies'] as const;

type Group = (typeof GROUPS)[number];

export interface DependencyRange {
  name: string;
  group: Group;
  range: string;
}

/** One dependency the upgrade would move, and what it would move it to. */
export interface PlannedChange extends DependencyRange {
  to: string;
  /** Why it is being left alone, when it is. */
  skipped?: string | undefined;
}

interface Manifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/** Every `@lsw-abpvue/*` dependency a project declares, wherever it declares it. */
export function abpVueDependencies(manifest: Manifest): DependencyRange[] {
  return GROUPS.flatMap(group =>
    Object.entries(manifest[group] ?? {})
      .filter(([name]) => name.startsWith(SCOPE))
      .map(([name, range]) => ({ name, group, range })),
  );
}

/** Keeps the modifier the project chose: `^0.1.0` upgrades to `^0.2.0`, not to `0.2.0`. */
function rangeFor(range: string, version: string): string | undefined {
  const parsed = parseRange(range);

  return parsed ? `${parsed.modifier}${version}` : undefined;
}

export interface PlanOptions {
  manifest: Manifest;
  version: string;
  /** Packages whose source the project has taken over; those are left alone. */
  released: ReadonlySet<string>;
}

/**
 * What an upgrade would do to a project's manifest, without doing any of it.
 * @param options The manifest, the version and what to leave alone
 */
export function planUpgrade(options: PlanOptions): PlannedChange[] {
  return abpVueDependencies(options.manifest).map(dependency => {
    const to = rangeFor(dependency.range, options.version);

    if (options.released.has(dependency.name)) {
      return {
        ...dependency,
        to: dependency.range,
        skipped: 'its source is in this project, so an upgrade would not reach it',
      };
    }

    if (!to) {
      return {
        ...dependency,
        to: dependency.range,
        skipped: `"${dependency.range}" is not a version this can rewrite`,
      };
    }

    return { ...dependency, to };
  });
}

function formattingOf(text: string): FormattingOptions {
  const indent = /\n(\s+)"/.exec(text)?.[1] ?? '  ';

  return {
    tabSize: indent.length,
    insertSpaces: !indent.includes('\t'),
    eol: text.includes('\r\n') ? '\r\n' : '\n',
  };
}

/**
 * Writes the planned versions into `package.json`, through an AST so comments,
 * key order and formatting survive.
 *
 * @param project The application root
 * @param changes What `planUpgrade` decided
 * @returns The changes that were actually written
 */
export async function writeUpgrade(
  project: string,
  changes: readonly PlannedChange[],
): Promise<PlannedChange[]> {
  const path = join(project, 'package.json');
  const original = await readFile(path, 'utf8').catch(() => undefined);

  if (original === undefined) {
    throw new CliError(`${project} has no package.json, so it is not a project.`);
  }

  const applied = changes.filter(change => !change.skipped && change.to !== change.range);
  let text = original;

  for (const change of applied) {
    text = applyEdits(
      text,
      modify(text, [change.group, change.name], change.to, {
        formattingOptions: formattingOf(text),
      }),
    );
  }

  if (applied.length > 0) {
    try {
      await writeFile(path, text, 'utf8');
    } catch (cause) {
      throw new CliError(`Could not write ${path}: ${(cause as Error).message}.`, { cause });
    }
  }

  return applied;
}

/** The project's manifest, parsed. */
export async function readManifest(project: string): Promise<Manifest> {
  const path = join(project, 'package.json');

  try {
    return JSON.parse(await readFile(path, 'utf8')) as Manifest;
  } catch (cause) {
    throw new CliError(`${path} is not there or is not readable JSON.`, { cause });
  }
}
