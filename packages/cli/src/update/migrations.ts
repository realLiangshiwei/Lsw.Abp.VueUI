import { compareVersions } from './versions.js';

export interface MigrationContext {
  /** The application root. */
  project: string;
  /** Says what would change and writes nothing. */
  dryRun: boolean;
}

/** One breaking change, and the edit that carries a project across it. */
export interface Migration {
  /** The version this migration brings a project up to. */
  version: string;
  /** One line, printed as what happened. */
  description: string;
  /** @returns What it changed, one line per file; empty when there was nothing to do */
  run(context: MigrationContext): Promise<string[]>;
}

/**
 * Every migration this CLI knows, oldest first. A release with a breaking change adds
 * one here; there have been none, which is what an empty list means rather than a
 * missing feature.
 */
export const MIGRATIONS: readonly Migration[] = [];

/**
 * The migrations between two versions: everything published after `from`, up to and
 * including `to`. A project that skipped three releases runs all three in order.
 *
 * @param from The version the project is on
 * @param to The version it is going to
 * @param migrations The registry to pick from; the built-in one unless a test says otherwise
 */
export function migrationsBetween(
  from: string,
  to: string,
  migrations: readonly Migration[] = MIGRATIONS,
): Migration[] {
  return [...migrations]
    .filter(
      migration =>
        compareVersions(migration.version, from) > 0 && compareVersions(migration.version, to) <= 0,
    )
    .sort((left, right) => compareVersions(left.version, right.version));
}
