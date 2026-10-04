import { rename, rm, stat } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import process from 'node:process';
import * as prompts from '@clack/prompts';
import { defineCommand } from 'citty';
import { failed, formatChecks } from '../diagnostics/checks.js';
import { checkEnvironment } from '../diagnostics/environment.js';
import { CliError, isUserFacingError } from '../errors.js';
import { generateProxy, installDependencies, releaseAskedSources } from './frontend.js';
import { configureBackend, type BackendEdit } from '../solution/backend-config.js';
import { findSolutionUpwards, readSolution, type Solution } from '../solution/locate.js';
import { frontendDirectoryOf, projectRootOf } from '../solution/layout.js';
import { readTemplateManifest, moduleBlocks } from '../template/manifest.js';
import { templateRoot } from '../template/paths.js';
import { renderTemplate } from '../template/render.js';
import { Rollback } from '../system/rollback.js';
import { run } from '../system/run.js';
import { cliVersion } from '../system/version.js';
import { diffPath, unifiedDiff } from '../system/diff.js';

/** The options of `abpv switch-ui`. */
export interface SwitchUiArgs {
  cwd?: string | undefined;
  solution?: string | undefined;
  mode?: string | undefined;
  dir?: string | undefined;
  port?: string | number | undefined;
  modules?: string | undefined;
  template?: string | undefined;
  force?: boolean | undefined;
  'package-manager'?: string | undefined;
  'skip-backend-config'?: boolean | undefined;
  'skip-proxy'?: boolean | undefined;
  'skip-install'?: boolean | undefined;
  'with-source-code'?: string | undefined;
  'dry-run'?: boolean | undefined;
}

/** One thing the command moved out of the way rather than deleting (design 08 §4, S6). */
export interface Renamed {
  from: string;
  to: string;
}

export interface SwitchUiResult {
  diff: string[];
  solution: Solution;
  frontend: string;
  files: string[];
  renamed: Renamed[];
  /** Backend paths relative to the project root containing the backend. */
  edits: BackendEdit[];
  notes: string[];
}

/** The UI directories the official templates write, which are the ones this can move. */
const GENERATED_UIS = ['angular', 'react'];

const DEFAULT_PORT = 4200;

async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}

/**
 * Refuses to touch a checkout with uncommitted work in it, because the way back from this
 * command is the version control the solution is already under (design 08 §4, S1).
 */
async function assertCommitted(
  roots: readonly string[],
  args: SwitchUiArgs,
  notes: string[],
): Promise<void> {
  if (args.force === true) return;

  let found = false;
  for (const root of new Set(roots)) {
    const { code, output } = await run('git', ['status', '--porcelain'], { cwd: root }).catch(
      () => ({
        code: null,
        output: '',
      }),
    );
    if (code !== 0) continue;
    found = true;
    if (output.trim() !== '') {
      throw new CliError(
        `${root} has uncommitted changes, and this command edits files you already have. ` +
          'Commit them first, or pass --force.',
      );
    }
  }
  if (!found)
    notes.push('Not a git checkout, so there is nothing to compare what changed against.');
}

/** Moves a directory aside under a name that is free, and says how to move it back. */
async function moveAside(path: string, rollback: Rollback, dryRun: boolean): Promise<Renamed> {
  let target = `${path}.bak`;
  for (let suffix = 1; await exists(target); suffix += 1) target = `${path}.${suffix}.bak`;

  if (!dryRun) {
    await rename(path, target);
    rollback.add(`put ${basename(path)} back`, () => rename(target, path));
  }

  return { from: path, to: target };
}

async function chosenBlocks(source: string, args: SwitchUiArgs): Promise<string[]> {
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

  return asked ?? available;
}

/**
 * Adds a Vue frontend to a solution that already exists, and points the backend at it.
 * Everything it does to a file someone already had is reversible: the old UI directory is
 * renamed rather than deleted, the configuration is copied before it is edited, and an
 * interrupt puts both back (design 08 §4).
 *
 * @param args What to do, and to which solution
 */
export async function runSwitchUi(args: SwitchUiArgs): Promise<SwitchUiResult> {
  const cwd = args.cwd ?? process.cwd();
  const dryRun = args['dry-run'] === true;
  const mode = args.mode ?? 'replace';
  const port = Number(args.port ?? DEFAULT_PORT);
  const appUrl = `http://localhost:${port}`;
  const notes: string[] = [];

  if (mode !== 'replace' && mode !== 'keep') {
    throw new CliError(`--mode is replace or keep, not "${mode}".`);
  }

  const given =
    args.solution && (isAbsolute(args.solution) ? args.solution : resolve(cwd, args.solution));
  const solution = await readSolution(given ?? (await findSolutionUpwards(cwd)));
  const root = projectRootOf(solution.root);
  const frontend = frontendDirectoryOf(root, solution.root, args.dir);

  const checks = await checkEnvironment({
    backend: false,
    packageManager: args['skip-install'] ? undefined : (args['package-manager'] ?? 'pnpm'),
  });

  if (failed(checks).length > 0) {
    throw new CliError(
      `This machine is missing something the command needs.\n${formatChecks(checks)}`,
    );
  }

  if (!dryRun) await assertCommitted([root, solution.root], args, notes);

  const source = args.template
    ? isAbsolute(args.template)
      ? args.template
      : resolve(cwd, args.template)
    : templateRoot();
  const blocks = await chosenBlocks(source, args);

  const rollback = new Rollback();
  rollback.watchInterrupts(undone => prompts.log.warn(['Interrupted.', ...undone].join('\n  ')));

  try {
    const renamed: Renamed[] = [];

    // The generated UI, if the solution has one and the caller did not ask to keep it.
    for (const name of mode === 'replace' ? GENERATED_UIS : []) {
      const path = join(root, name);
      if (!(await exists(path))) continue;

      renamed.push(await moveAside(path, rollback, dryRun));
    }

    // A second run, or a directory that was already called `vue`. Never deleted (S6).
    if (await exists(frontend)) {
      renamed.push(await moveAside(frontend, rollback, dryRun));
    }

    if (!dryRun) {
      rollback.add(`removed ${relative(root, frontend)}`, () =>
        rm(frontend, { recursive: true, force: true }),
      );
    }

    const { written, contents, binary } = await renderTemplate({
      source,
      target: frontend,
      blocks,
      version: cliVersion(),
      dryRun,
      values: {
        projectName: solution.name,
        appName: solution.appName,
        clientId: solution.clientId,
        apiUrl: solution.hostUrl,
        authUrl: solution.authUrl,
        appUrl,
      },
    });

    const diff = dryRun
      ? [
          ...renamed.map(({ from, to }) => {
            const fromPath = diffPath(relative(root, from));
            const toPath = diffPath(relative(root, to));
            return [
              `diff --git a/${fromPath} b/${toPath}`,
              `rename from ${fromPath}`,
              `rename to ${toPath}`,
            ].join('\n');
          }),
          ...Object.entries(contents).map(([file, body]) =>
            unifiedDiff(relative(root, join(frontend, file)), '', body),
          ),
          ...binary.map(
            file =>
              `Binary files /dev/null and b/${diffPath(relative(root, join(frontend, file)))} differ`,
          ),
        ]
      : [];

    const edits =
      args['skip-backend-config'] === true
        ? []
        : await configureBackend({
            solution,
            appUrl,
            dryRun,
            backup: true,
            rollback,
            preview: (file, before, after) => {
              if (dryRun)
                diff.push(unifiedDiff(relative(root, join(solution.root, file)), before, after));
            },
          });

    if (edits.length > 0) {
      notes.push('The backend configuration changed, so the DbMigrator has to run again.');
    }

    if (!dryRun) {
      const frontendOptions = {
        frontend,
        apiUrl: solution.hostUrl,
        packageManager: args['package-manager'] ?? 'pnpm',
        skipProxy: args['skip-proxy'],
        skipInstall: args['skip-install'],
        withSourceCode: (args['with-source-code'] ?? '')
          .split(',')
          .map(name => name.trim())
          .filter(Boolean),
        notes,
        rollback,
      };

      await installDependencies(frontendOptions);
      await releaseAskedSources(frontendOptions);
      await generateProxy(frontendOptions);
    }

    return {
      solution,
      frontend,
      files: written,
      renamed,
      edits: edits.map(edit => ({ ...edit, file: relative(root, join(solution.root, edit.file)) })),
      notes,
      diff,
    };
  } catch (error) {
    const undone = await rollback.run();
    if (undone.length > 0) prompts.log.warn(['Taken back:', ...undone].join('\n  '));

    throw error;
  } finally {
    rollback.commit();
  }
}

function print(result: SwitchUiResult, args: SwitchUiArgs): void {
  const dryRun = args['dry-run'] === true;
  const root = projectRootOf(result.solution.root);
  const lines: string[] = [];

  for (const { from, to } of result.renamed) {
    lines.push(`  ${relative(root, from)}/ → ${relative(root, to)}/`);
  }

  for (const path of result.files) lines.push(`  + ${relative(root, join(result.frontend, path))}`);

  for (const edit of result.edits) {
    lines.push(`  ~ ${edit.file}  ${edit.key}: ${edit.from ?? '(absent)'} → ${edit.to}`);
  }

  prompts.log.info([dryRun ? 'What would change:' : 'What changed:', ...lines].join('\n'));
  if (dryRun && result.diff.length > 0) prompts.log.info(result.diff.join('\n\n'));
  if (result.notes.length > 0) prompts.log.info(result.notes.join('\n'));

  prompts.log.success(
    `${dryRun ? 'Would add' : 'Added'} a Vue frontend to ${result.solution.name}`,
  );
}

export const switchUiCommand = defineCommand({
  meta: { name: 'switch-ui', description: 'Add a Vue frontend to a solution that already exists' },
  args: {
    solution: { type: 'string', description: 'The solution root; found upwards when absent' },
    mode: {
      type: 'string',
      description: 'replace renames the old UI aside, keep leaves it',
      default: 'replace',
    },
    dir: { type: 'string', description: 'The frontend directory', default: 'vue' },
    port: { type: 'string', description: 'The development port', default: String(DEFAULT_PORT) },
    modules: { type: 'string', description: 'Module UIs to wire up, comma separated' },
    template: { type: 'string', description: 'Render from this directory instead' },
    'package-manager': { type: 'string', description: 'pnpm, npm or yarn', default: 'pnpm' },
    force: { type: 'boolean', description: 'Run even with uncommitted changes' },
    'skip-proxy': { type: 'boolean', description: 'Do not generate the proxy' },
    'skip-install': { type: 'boolean', description: 'Do not install the dependencies' },
    'with-source-code': {
      type: 'string',
      description: "Release these packages' source into the project, or all",
    },
    'skip-backend-config': { type: 'boolean', description: 'Leave the appsettings alone' },
    'dry-run': { type: 'boolean', description: 'Say what would happen and change nothing' },
  },
  run: async ({ args }) => {
    try {
      print(await runSwitchUi(args as unknown as SwitchUiArgs), args as unknown as SwitchUiArgs);
    } catch (error) {
      if (!isUserFacingError(error)) throw error;

      prompts.log.error(error.message);
      process.exit(1);
    }
  },
});
