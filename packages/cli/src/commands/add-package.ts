import process from 'node:process';
import * as prompts from '@clack/prompts';
import { defineCommand } from 'citty';
import { CliError, isUserFacingError } from '../errors.js';
import {
  releasablePackages,
  releaseSourceCode,
  type ReleaseResult,
} from '../source-code/release.js';

/** The options of `abpv add-package`. */
export interface AddPackageArgs {
  cwd?: string | undefined;
  package?: string | undefined;
  'with-source-code'?: boolean | undefined;
  'list-source-ready'?: boolean | undefined;
  'dry-run'?: boolean | undefined;
}

export interface AddPackageResult {
  release?: ReleaseResult | undefined;
  /** What `--list-source-ready` found. */
  releasable?: string[] | undefined;
}

/**
 * Releases a package's source into the project, the way `abp add-package --with-source-code`
 * does for Angular. Installing a package is the package manager's job and this does not
 * try to be one.
 *
 * @param args What to release, and where
 */
export async function runAddPackage(args: AddPackageArgs): Promise<AddPackageResult> {
  const project = args.cwd ?? process.cwd();

  if (args['list-source-ready'] === true) {
    return { releasable: await releasablePackages(project) };
  }

  const names = (args.package ?? '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);

  if (names.length === 0) {
    throw new CliError('Which package? abpv add-package @lsw-abpvue/identity --with-source-code');
  }

  if (args['with-source-code'] !== true) {
    throw new CliError(
      `Installing a package is what your package manager is for: add ${names.join(' ')} with it. ` +
        'This command releases the source of one you already have: pass --with-source-code.',
    );
  }

  return {
    release: await releaseSourceCode({
      project,
      packages: names,
      dryRun: args['dry-run'],
    }),
  };
}

/** What a project should know it has taken on, printed by every command that does it. */
export function describeRelease(result: ReleaseResult): string[] {
  const lines: string[] = [];

  for (const entry of result.released) {
    lines.push(`  ${entry.name} ${entry.version} → ${entry.path}`);
  }

  if (result.released.length > 0) {
    lines.push(
      'These no longer follow releases of the packages they came from: an upgrade will not',
      'touch them, and a fix published upstream has to be brought over by hand.',
    );
  }

  const added = Object.keys(result.added);
  if (added.length > 0) {
    lines.push(
      `What the released source imports and the project did not depend on: ${added.join(', ')}.`,
      'They were added to package.json, so install again before building.',
    );
  }

  for (const name of result.missing) {
    lines.push(`  ${name} is not installed, so there was no source to release.`);
  }

  return lines;
}

function print(result: AddPackageResult, args: AddPackageArgs): void {
  if (result.releasable) {
    prompts.log.info(
      result.releasable.length > 0
        ? [
            'The packages whose source can be released:',
            ...result.releasable.map(n => `  ${n}`),
          ].join('\n')
        : 'This project depends on no package whose source is worth releasing.',
    );
    return;
  }

  const release = result.release;
  if (!release) return;

  prompts.log.info(
    [args['dry-run'] ? 'What would be released:' : 'Released:', ...describeRelease(release)].join(
      '\n',
    ),
  );

  prompts.log.success(
    `${args['dry-run'] ? 'Would release' : 'Released'} ${release.released.length} packages`,
  );
}

const args = {
  package: {
    type: 'positional',
    required: false,
    description: 'The package, comma separated, or all',
  },
  'with-source-code': { type: 'boolean', description: 'Copy its source into the project' },
  'list-source-ready': { type: 'boolean', description: 'List what can be released' },
  'dry-run': { type: 'boolean', description: 'Say what would happen and change nothing' },
} as const;

async function guarded(parsed: AddPackageArgs): Promise<void> {
  try {
    print(await runAddPackage(parsed), parsed);
  } catch (error) {
    if (!isUserFacingError(error)) throw error;

    prompts.log.error(error.message);
    process.exit(1);
  }
}

export const addPackageCommand = defineCommand({
  meta: { name: 'add-package', description: "Release a package's source into the project" },
  args,
  run: ({ args: parsed }) => guarded(parsed as unknown as AddPackageArgs),
});

/** The same command under the word people who have done this before reach for. */
export const ejectCommand = defineCommand({
  meta: { name: 'eject', description: 'add-package --with-source-code, under another name' },
  args,
  run: ({ args: parsed }) =>
    guarded({ ...(parsed as unknown as AddPackageArgs), 'with-source-code': true }),
});
