import { rm, stat } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import process from 'node:process';
import * as prompts from '@clack/prompts';
import { defineCommand } from 'citty';
import { failed, formatChecks, printChecks, type Check } from '../diagnostics/checks.js';
import { checkEnvironment } from '../diagnostics/environment.js';
import { generateProxy, installDependencies } from './frontend.js';
import { CliError, isUserFacingError } from '../errors.js';
import { abpNewArgs, splitArgs } from '../solution/abp-cli.js';
import { configureBackend, type BackendEdit } from '../solution/backend-config.js';
import { findSolutionRoot, readSolution, type Solution } from '../solution/locate.js';
import { moduleBlocks, readTemplateManifest } from '../template/manifest.js';
import { templateRoot } from '../template/paths.js';
import { renderTemplate } from '../template/render.js';
import { run } from '../system/run.js';
import { Rollback } from '../system/rollback.js';
import { cliVersion } from '../system/version.js';

/** The options of `abpv new`, as the flags spell them. Everything else goes to `abp new`. */
export interface NewArgs {
  cwd?: string | undefined;
  dir?: string | undefined;
  port?: string | number | undefined;
  backend?: string | undefined;
  modules?: string | undefined;
  template?: string | undefined;
  'package-manager'?: string | undefined;
  'no-backend'?: boolean | undefined;
  'sample-crud'?: boolean | undefined;
  'skip-proxy'?: boolean | undefined;
  'skip-install'?: boolean | undefined;
  'dry-run'?: boolean | undefined;
}

export interface NewResult {
  /** The solution root, or the application's own directory when there is no backend. */
  root: string;
  /** Where the frontend was written. */
  frontend: string;
  files: string[];
  edits: BackendEdit[];
  /** What was decided along the way and is worth saying out loud. */
  notes: string[];
  checks: Check[];
}

const DEFAULT_PORT = 4200;
/** Where a solution with no launch settings of its own would be. */
const DEFAULT_BACKEND = 'https://localhost:44300';

async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}

/** The sample CRUD page has a backend half, and it is the official CLI that writes it. */
function withSampleCrud(passthrough: readonly string[]): string[] {
  const asked = passthrough.some(arg => arg === '-scp' || arg === '--sample-crud-page');

  return asked ? [...passthrough] : [...passthrough, '-scp'];
}

async function chosenBlocks(source: string, args: NewArgs): Promise<string[]> {
  const available = moduleBlocks(await readTemplateManifest(source));
  const asked = args.modules
    ?.split(',')
    .map(name => name.trim())
    .filter(Boolean);

  for (const name of asked ?? []) {
    if (!available.includes(name)) {
      throw new CliError(`--modules has no "${name}". The template has: ${available.join(', ')}.`);
    }
  }

  return [...(asked ?? available), ...(args['sample-crud'] ? ['sample-crud'] : [])];
}

/** Runs the official CLI, and remembers the directory it created so an interrupt can undo it. */
async function generateBackend(
  name: string,
  passthrough: readonly string[],
  cwd: string,
  rollback: Rollback,
): Promise<Solution> {
  const args = abpNewArgs(name, passthrough);
  const created = join(cwd, name);
  const existed = await exists(created);

  prompts.log.step(`abp ${args.join(' ')}`);
  const { code } = await run('abp', args, { cwd, stream: true });

  if (code !== 0) {
    throw new CliError(`abp new exited with ${code}, so there is no solution to build on.`);
  }

  if (!existed && (await exists(created))) {
    rollback.add(`removed ${created}`, () => rm(created, { recursive: true, force: true }));
  }

  return readSolution(await findSolutionRoot(cwd, name));
}

/**
 * Creates a solution: the backend by the official ABP CLI, the frontend from this
 * project's template, and the configuration that makes the two talk to each other.
 *
 * @param args The options this command reads itself
 * @param rawArgs The command line after `abpv new`, so the rest reaches `abp new` as typed
 */
export async function runNew(args: NewArgs, rawArgs: readonly string[]): Promise<NewResult> {
  const cwd = args.cwd ?? process.cwd();
  const { name, passthrough } = splitArgs(rawArgs);
  const dryRun = args['dry-run'] === true;
  const packageManager = args['package-manager'] ?? 'pnpm';
  const port = Number(args.port ?? DEFAULT_PORT);
  const appUrl = `http://localhost:${port}`;
  const notes: string[] = [];

  const checks = await checkEnvironment({
    backend: args['no-backend'] !== true,
    packageManager: args['skip-install'] ? undefined : packageManager,
  });

  if (failed(checks).length > 0) {
    throw new CliError(
      `This machine is missing something the command needs.\n${formatChecks(checks)}`,
    );
  }

  const source = args.template
    ? isAbsolute(args.template)
      ? args.template
      : resolve(cwd, args.template)
    : templateRoot();

  const blocks = await chosenBlocks(source, args);
  const rollback = new Rollback();
  rollback.watchInterrupts(undone => prompts.log.warn(['Interrupted.', ...undone].join('\n  ')));

  try {
    let solution: Solution | undefined;

    if (args['no-backend'] === true) {
      notes.push('No backend was created, so nothing was configured on one either.');
    } else if (dryRun) {
      notes.push(`Would run: abp ${abpNewArgs(name, passthrough).join(' ')}`);
    } else {
      solution = await generateBackend(
        name,
        args['sample-crud'] ? withSampleCrud(passthrough) : passthrough,
        cwd,
        rollback,
      );
    }

    // With no backend beside it the application is the project, and there is nothing for
    // a subdirectory to keep it apart from.
    const root = solution?.root ?? join(cwd, name);
    const frontend = args['no-backend'] === true ? root : join(root, args.dir ?? 'vue');

    const appName = solution?.appName ?? (name.split('.').at(-1) as string);
    const apiUrl = args.backend ?? solution?.hostUrl ?? DEFAULT_BACKEND;

    const existed = await exists(frontend);
    const { written } = await renderTemplate({
      source,
      target: frontend,
      blocks,
      version: cliVersion(),
      dryRun,
      values: {
        projectName: name,
        appName,
        clientId: solution?.clientId ?? `${appName}_App`,
        apiUrl,
        authUrl: solution?.authUrl ?? apiUrl,
        appUrl,
      },
    });

    if (!existed && !dryRun) {
      rollback.add(`removed ${frontend}`, () => rm(frontend, { recursive: true, force: true }));
    }

    const edits = solution
      ? await configureBackend({ solution, appUrl, dryRun })
      : ([] as BackendEdit[]);

    if (edits.length > 0) {
      notes.push('The backend configuration changed, so the DbMigrator has to run again.');
    }

    if (!dryRun) {
      const frontendOptions = {
        frontend,
        apiUrl,
        packageManager,
        skipProxy: args['skip-proxy'],
        skipInstall: args['skip-install'],
        notes,
      };

      await generateProxy(frontendOptions);
      await installDependencies(frontendOptions);
    }

    rollback.commit();

    return { root, frontend, files: written, edits, notes, checks };
  } catch (error) {
    const undone = await rollback.run();
    if (undone.length > 0) prompts.log.warn(['Taken back:', ...undone].join('\n  '));

    throw error;
  }
}

export const newCommand = defineCommand({
  meta: { name: 'new', description: 'Create an ABP solution with a Vue frontend' },
  args: {
    name: { type: 'positional', description: 'The solution name, e.g. Acme.BookStore' },
    dir: { type: 'string', description: 'The frontend directory', default: 'vue' },
    port: { type: 'string', description: 'The development port', default: String(DEFAULT_PORT) },
    backend: { type: 'string', description: 'The backend address, overriding what was detected' },
    modules: { type: 'string', description: 'Module UIs to wire up, comma separated' },
    template: { type: 'string', description: 'Render from this directory instead' },
    'package-manager': { type: 'string', description: 'pnpm, npm or yarn', default: 'pnpm' },
    'no-backend': { type: 'boolean', description: 'Skip abp new and generate only the frontend' },
    'sample-crud': { type: 'boolean', description: "Add ABP's Books sample, backend and page" },
    'skip-proxy': { type: 'boolean', description: 'Do not generate the proxy' },
    'skip-install': { type: 'boolean', description: 'Do not install the dependencies' },
    'dry-run': { type: 'boolean', description: 'Say what would happen and change nothing' },
  },
  run: async ({ args, rawArgs }) => {
    try {
      const result = await runNew(args as unknown as NewArgs, rawArgs);
      print(result, args as unknown as NewArgs);
    } catch (error) {
      if (!isUserFacingError(error)) throw error;

      prompts.log.error(error.message);
      process.exit(1);
    }
  },
});

function print(result: NewResult, args: NewArgs): void {
  printChecks(result.checks);

  if (result.edits.length > 0) {
    prompts.log.info(
      [
        'What changed in the backend:',
        ...result.edits.map(edit => `  ${edit.file}  ${edit.key}`),
      ].join('\n'),
    );
  }

  if (result.notes.length > 0) prompts.log.info(result.notes.join('\n'));

  const verb = args['dry-run'] ? 'Would write' : 'Wrote';
  prompts.log.success(`${verb} ${result.files.length} files to ${result.frontend}`);
}
