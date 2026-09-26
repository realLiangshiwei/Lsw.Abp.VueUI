import process from 'node:process';
import * as prompts from '@clack/prompts';
import { defineCommand } from 'citty';
import { CliError, isUserFacingError } from '../errors.js';
import { readSourceCodeRecord, type ReleasedPackage } from '../source-code/record.js';
import { planUpgrade, readManifest, writeUpgrade, type PlannedChange } from '../update/manifest.js';
import { migrationsBetween, type Migration } from '../update/migrations.js';
import { ANCHOR, compareVersions, latestVersion, parseRange } from '../update/versions.js';

/** The options of `abpvue update`, as the flags spell them. */
export interface UpdateArgs {
  cwd?: string | undefined;
  to?: string | undefined;
  tag?: string | undefined;
  'dry-run'?: boolean | undefined;
  /** Injected by the tests, which have no registry to ask. */
  fetch?: typeof globalThis.fetch | undefined;
  /** Injected by the tests; the built-in registry otherwise. */
  migrations?: readonly Migration[] | undefined;
}

export interface UpdateResult {
  /** What the project was on, as its `@lsw-abpvue/core` range names it. */
  from: string | undefined;
  to: string;
  changes: PlannedChange[];
  /** The packages whose source the project has taken over. */
  released: ReleasedPackage[];
  migrations: { version: string; description: string; changed: string[] }[];
  dryRun: boolean;
}

/**
 * Runs `abpvue update`: moves the project's `@lsw-abpvue/*` ranges to one version, runs
 * whatever migrations lie between, and says which packages the upgrade could not reach.
 *
 * @param args The options, as the flags spell them
 */
export async function runUpdate(args: UpdateArgs): Promise<UpdateResult> {
  const project = args.cwd ?? process.cwd();
  const manifest = await readManifest(project);
  const record = await readSourceCodeRecord(project);
  const released = Object.values(record.packages);

  const current = manifest.dependencies?.[ANCHOR] ?? manifest.devDependencies?.[ANCHOR];
  const from = current ? parseRange(current)?.version : undefined;

  const to =
    args.to ??
    (await latestVersion({
      ...(args.tag ? { tag: args.tag } : {}),
      ...(args.fetch ? { fetch: args.fetch } : {}),
    }));

  if (!parseRange(to)) {
    throw new CliError(`"${to}" is not a version. Pass --to with one, e.g. --to 0.2.0.`);
  }

  if (from && compareVersions(from, to) > 0) {
    throw new CliError(
      `This project is on ${from}, which is newer than ${to}. Downgrading is a job for your ` +
        'package manager; this command only moves forwards.',
    );
  }

  const changes = planUpgrade({
    manifest,
    version: to,
    released: new Set(released.map(entry => entry.name)),
  });

  const dryRun = args['dry-run'] === true;
  const written = dryRun
    ? changes.filter(change => !change.skipped)
    : await writeUpgrade(project, changes);

  const migrations: UpdateResult['migrations'] = [];

  for (const migration of migrationsBetween(from ?? '0.0.0', to, args.migrations)) {
    migrations.push({
      version: migration.version,
      description: migration.description,
      changed: await migration.run({ project, dryRun }),
    });
  }

  return {
    from,
    to,
    changes: changes.map(change =>
      written.some(applied => applied.name === change.name && applied.group === change.group)
        ? change
        : { ...change, skipped: change.skipped ?? 'already on that version' },
    ),
    released,
    migrations,
    dryRun,
  };
}

function print(result: UpdateResult): void {
  const moved = result.changes.filter(change => !change.skipped);
  const verb = result.dryRun ? 'Would move' : 'Moved';

  if (moved.length > 0) {
    prompts.log.success(
      [
        `${verb} ${moved.length} packages to ${result.to}${result.from ? ` (from ${result.from})` : ''}:`,
        ...moved.map(change => `  - ${change.name} ${change.range} → ${change.to}`),
      ].join('\n'),
    );
  } else {
    prompts.log.info(`Nothing to move: the project is already on ${result.to}.`);
  }

  for (const migration of result.migrations) {
    prompts.log.info(
      [
        `${migration.version}: ${migration.description}`,
        ...migration.changed.map(l => `  - ${l}`),
      ].join('\n'),
    );
  }

  if (result.released.length > 0) {
    prompts.log.warn(
      [
        'These have their source in this project, so the upgrade did not reach them:',
        ...result.released.map(entry => `  - ${entry.name} ${entry.version} in ${entry.path}`),
        'Bring the changes over by hand, or delete the released source and install again.',
      ].join('\n'),
    );
  }

  if (moved.length > 0 && !result.dryRun) {
    prompts.log.info('package.json has changed; install again before building.');
  }
}

async function guarded(args: UpdateArgs): Promise<void> {
  try {
    print(await runUpdate(args));
  } catch (error) {
    if (!isUserFacingError(error)) throw error;

    prompts.log.error(error.message);
    process.exit(1);
  }
}

export const updateCommand = defineCommand({
  meta: {
    name: 'update',
    description: 'Move the project’s @lsw-abpvue packages to a newer version',
  },
  args: {
    to: {
      type: 'string',
      description: 'The version to upgrade to; the registry decides otherwise',
    },
    tag: {
      type: 'string',
      description: 'The dist-tag to read the version from',
      default: 'latest',
    },
    'dry-run': {
      type: 'boolean',
      description: 'Say what would change and write nothing',
      default: false,
    },
  },
  run: ({ args }) => guarded(args as unknown as UpdateArgs),
});
