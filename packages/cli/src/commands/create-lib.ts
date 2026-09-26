import { rm, stat } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import process from 'node:process';
import * as prompts from '@clack/prompts';
import { defineCommand } from 'citty';
import { CliError, isUserFacingError } from '../errors.js';
import { kebabCase, pascalCase } from '../generator/names.js';
import { templateRoot } from '../template/paths.js';
import { renderTemplate } from '../template/render.js';
import { cliVersion } from '../system/version.js';

/** What the library template calls its example module, everywhere it names it. */
const SAMPLE = 'Sample';
const SAMPLE_PACKAGE = '@lsw-abpvue/template-lib';

/** The options of `abpvue create-lib`, as the flags spell them. */
export interface CreateLibArgs {
  name?: string | undefined;
  cwd?: string | undefined;
  package?: string | undefined;
  target?: string | undefined;
  resource?: string | undefined;
  description?: string | undefined;
  template?: string | undefined;
  'dry-run'?: boolean | undefined;
}

export interface CreateLibResult {
  /** The module name, as the generated code spells it. */
  name: string;
  packageName: string;
  /** Where the package was written. */
  target: string;
  files: string[];
  dryRun: boolean;
}

async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}

/**
 * Creates the Vue UI package of a third-party ABP module: three entry points, the five
 * extension points wired up, a page, its routes and its menu entry.
 *
 * @param args The options, as the flags spell them
 */
export async function runCreateLib(args: CreateLibArgs): Promise<CreateLibResult> {
  const given = args.name?.trim();

  if (!given) {
    throw new CliError(
      'Which module? Pass a name, e.g. `abpv create-lib Blogging`. It is what the package ' +
        "calls its component key, its permissions and its routes, so use the module's own name.",
    );
  }

  const name = pascalCase(given);
  const kebab = kebabCase(name);
  const packageName = args.package ?? `abp-vue-${kebab}`;
  const cwd = args.cwd ?? process.cwd();
  const relative = args.target ?? kebab;
  const target = isAbsolute(relative) ? relative : resolve(cwd, relative);

  if (await exists(target)) {
    throw new CliError(`${relative} is already there. Pass --target with somewhere else.`);
  }

  const source = args.template ?? templateRoot('lib');
  let written: string[];

  try {
    ({ written } = await renderTemplate({
      source,
      target,
      packageName,
      blocks: [],
      version: cliVersion(),
      dryRun: args['dry-run'],
      values: {},
      ...(args.description ? { description: args.description } : {}),
      // The template's example module is called `Sample` in its code, its file names and
      // its localization keys; a name that has to keep compiling cannot be a placeholder.
      renames: {
        [SAMPLE_PACKAGE]: packageName,
        [SAMPLE]: name,
        [SAMPLE.toLowerCase()]: kebab,
        [SAMPLE.toUpperCase()]: kebab.replace(/-/g, '_').toUpperCase(),
      },
    }));
  } catch (cause) {
    // The directory did not exist a moment ago, so taking the whole of it back is safe
    // -- and half a package is worse than none, because the next run would refuse to
    // write over what is there.
    if (!args['dry-run']) await rm(target, { recursive: true, force: true });

    throw new CliError(`Could not write the package: ${(cause as Error).message}.`, { cause });
  }

  return { name, packageName, target: relative, files: written, dryRun: args['dry-run'] === true };
}

function print(result: CreateLibResult): void {
  const verb = result.dryRun ? 'Would write' : 'Wrote';

  prompts.log.success(
    `${verb} ${result.files.length} files to ${result.target} (${result.packageName})`,
  );

  if (result.dryRun) return;

  prompts.log.info(
    [
      'Next:',
      `  cd ${result.target} && pnpm install && pnpm build`,
      `  abpv proxy add --module <name> --target proxy/src   the backend's services`,
      `  edit src/components/${result.name}Page.vue          point it at those services`,
    ].join('\n'),
  );
}

async function guarded(args: CreateLibArgs): Promise<void> {
  try {
    print(await runCreateLib(args));
  } catch (error) {
    if (!isUserFacingError(error)) throw error;

    prompts.log.error(error.message);
    process.exit(1);
  }
}

export const createLibCommand = defineCommand({
  meta: {
    name: 'create-lib',
    description: 'Scaffold the Vue UI package of a third-party ABP module',
  },
  args: {
    name: { type: 'positional', description: 'The module, e.g. Blogging', required: false },
    package: { type: 'string', description: 'npm package name; abp-vue-<name> by default' },
    target: { type: 'string', description: 'Where to write it; ./<name> by default' },
    description: { type: 'string', description: "The package's description" },
    template: { type: 'string', description: 'Render from this directory instead' },
    'dry-run': {
      type: 'boolean',
      description: 'Say what would be written and write nothing',
      default: false,
    },
  },
  run: ({ args }) => guarded(args as unknown as CreateLibArgs),
});
