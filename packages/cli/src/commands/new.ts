import { rm, stat } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import process from 'node:process';
import * as prompts from '@clack/prompts';
import { defineCommand } from 'citty';
import { failed, formatChecks, printChecks, type Check } from '../diagnostics/checks.js';
import { checkEnvironment } from '../diagnostics/environment.js';
import { generateProxy, installDependencies, releaseAskedSources } from './frontend.js';
import { CliError, isUserFacingError } from '../errors.js';
import { abpNewArgs, newProjectDirectory, splitArgs } from '../solution/abp-cli.js';
import { configureBackend, type BackendEdit } from '../solution/backend-config.js';
import { readSolution, type Solution } from '../solution/locate.js';
import { BACKEND_DIRECTORY, frontendDirectoryOf } from '../solution/layout.js';
import { moduleBlocks, readTemplateManifest } from '../template/manifest.js';
import { templateRoot } from '../template/paths.js';
import { renderTemplate } from '../template/render.js';
import { run } from '../system/run.js';
import { Rollback } from '../system/rollback.js';
import { cliVersion } from '../system/version.js';

/** What the command needs beyond its command line. */
export interface NewOptions {
  /** Where it runs; the directory the solution is created in. */
  cwd?: string | undefined;
}

export interface NewResult {
  /** The project root, containing `aspnet-core/` and `vue/` when there is a backend. */
  root: string;
  /** Where the frontend was written. */
  frontend: string;
  files: string[];
  /** Backend paths relative to the project root. */
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

/** A comma separated flag, as a list; nothing at all when it was not given. */
function listOf(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);
}

/** The sample CRUD page has a backend half, and it is the official CLI that writes it. */
function withSampleCrud(passthrough: readonly string[]): string[] {
  const asked = passthrough.some(arg => arg === '-scp' || arg === '--sample-crud-page');

  return asked ? [...passthrough] : [...passthrough, '-scp'];
}

async function chosenBlocks(source: string, flags: Flags): Promise<string[]> {
  const available = moduleBlocks(await readTemplateManifest(source));
  const named = listOf(flags.value('modules'));
  const asked = named.length > 0 ? named : undefined;

  for (const name of asked ?? []) {
    if (!available.includes(name)) {
      throw new CliError(`--modules has no "${name}". The template has: ${available.join(', ')}.`);
    }
  }

  return [...(asked ?? available), ...(flags.on('sample-crud') ? ['sample-crud'] : [])];
}

/** Runs the official CLI, and remembers the directory it created so an interrupt can undo it. */
async function generateBackend(
  name: string,
  passthrough: readonly string[],
  cwd: string,
  root: string,
  rollback: Rollback,
): Promise<Solution> {
  const args = abpNewArgs(name, passthrough);
  const backend = join(root, BACKEND_DIRECTORY);
  if (await exists(backend)) {
    throw new CliError(
      `${backend} already exists. Choose another output directory or use abpv switch-ui.`,
    );
  }

  const created = (await exists(root)) ? backend : root;
  rollback.add(`removed ${created}`, () => rm(created, { recursive: true, force: true }));

  prompts.log.step(`abp ${args.join(' ')}`);
  const { code } = await run('abp', args, { cwd, stream: true });

  if (code !== 0) {
    throw new CliError(`abp new exited with ${code}, so there is no solution to build on.`);
  }

  return readSolution(backend);
}

/** The flags as they were typed, which is the only reading of them that is not lossy. */
class Flags {
  constructor(private readonly typed: Record<string, string | boolean>) {}

  value(name: string): string | undefined {
    const value = this.typed[name];

    return typeof value === 'string' ? value : undefined;
  }

  on(name: string): boolean {
    return this.typed[name] === true;
  }
}

/**
 * Creates a solution: the backend by the official ABP CLI, the frontend from this
 * project's template, and the configuration that makes the two talk to each other.
 *
 * @param rawArgs The command line after `abpv new`; the flags this command does not read
 * itself reach `abp new` as they were typed
 * @param options Where the command runs
 */
export async function runNew(
  rawArgs: readonly string[],
  options: NewOptions = {},
): Promise<NewResult> {
  const cwd = options.cwd ?? process.cwd();
  const split = splitArgs(rawArgs);
  const { name, passthrough } = split;
  const flags = new Flags(split.flags);
  const root = resolve(cwd, newProjectDirectory(name, passthrough));
  const backend = join(root, BACKEND_DIRECTORY);
  const frontend = flags.on('no-backend')
    ? root
    : frontendDirectoryOf(root, backend, flags.value('dir'));

  const dryRun = flags.on('dry-run');
  const packageManager = flags.value('package-manager') ?? 'pnpm';
  const port = Number(flags.value('port') ?? DEFAULT_PORT);
  const appUrl = `http://localhost:${port}`;
  const notes: string[] = [];

  if (!dryRun && (await exists(frontend))) {
    throw new CliError(
      `${frontend} already exists. Choose another output directory or use abpv switch-ui.`,
    );
  }

  const checks = await checkEnvironment({
    backend: !flags.on('no-backend'),
    packageManager: flags.on('skip-install') ? undefined : packageManager,
  });

  if (failed(checks).length > 0) {
    throw new CliError(
      `This machine is missing something the command needs.\n${formatChecks(checks)}`,
    );
  }

  const template = flags.value('template');
  const source = template
    ? isAbsolute(template)
      ? template
      : resolve(cwd, template)
    : templateRoot();

  const blocks = await chosenBlocks(source, flags);
  const rollback = new Rollback();
  rollback.watchInterrupts(undone => prompts.log.warn(['Interrupted.', ...undone].join('\n  ')));

  try {
    let solution: Solution | undefined;

    if (flags.on('no-backend')) {
      notes.push('No backend was created, so nothing was configured on one either.');
    } else if (dryRun) {
      notes.push(
        `Would run: abp ${abpNewArgs(name, flags.on('sample-crud') ? withSampleCrud(passthrough) : passthrough).join(' ')}`,
      );
    } else {
      solution = await generateBackend(
        name,
        flags.on('sample-crud') ? withSampleCrud(passthrough) : passthrough,
        cwd,
        root,
        rollback,
      );
    }

    const appName = solution?.appName ?? (name.split('.').at(-1) as string);
    const apiUrl = flags.value('backend') ?? solution?.hostUrl ?? DEFAULT_BACKEND;

    const existed = await exists(frontend);
    if (!existed && !dryRun) {
      rollback.add(`removed ${frontend}`, () => rm(frontend, { recursive: true, force: true }));
    }

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

    const edits = solution
      ? (await configureBackend({ solution, appUrl, dryRun })).map(edit => ({
          ...edit,
          file: relative(root, join(solution.root, edit.file)),
        }))
      : ([] as BackendEdit[]);

    if (edits.length > 0) {
      notes.push('The backend configuration changed, so the DbMigrator has to run again.');
    }

    if (!dryRun) {
      const frontendOptions = {
        frontend,
        apiUrl,
        packageManager,
        skipProxy: flags.on('skip-proxy'),
        skipInstall: flags.on('skip-install'),
        withSourceCode: listOf(flags.value('with-source-code')),
        notes,
        rollback,
      };

      await installDependencies(frontendOptions);
      await releaseAskedSources(frontendOptions);
      await generateProxy(frontendOptions);
    }

    return { root, frontend, files: written, edits, notes, checks };
  } catch (error) {
    const undone = await rollback.run();
    if (undone.length > 0) prompts.log.warn(['Taken back:', ...undone].join('\n  '));

    throw error;
  } finally {
    rollback.commit();
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
    'with-source-code': {
      type: 'string',
      description: "Release these packages' source into the project, or all",
    },
    'dry-run': { type: 'boolean', description: 'Say what would happen and change nothing' },
  },
  run: async ({ rawArgs }) => {
    try {
      print(await runNew(rawArgs), rawArgs);
    } catch (error) {
      if (!isUserFacingError(error)) throw error;

      prompts.log.error(error.message);
      process.exit(1);
    }
  },
});

function print(result: NewResult, rawArgs: readonly string[]): void {
  const dryRun = rawArgs.includes('--dry-run');
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

  const verb = dryRun ? 'Would write' : 'Wrote';
  prompts.log.success(`${verb} ${result.files.length} files to ${result.frontend}`);
}
