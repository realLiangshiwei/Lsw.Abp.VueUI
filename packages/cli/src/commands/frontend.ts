import process from 'node:process';
import * as prompts from '@clack/prompts';
import { reachBackend } from '../diagnostics/backend.js';
import { releaseSourceCode } from '../source-code/release.js';
import type { Rollback } from '../system/rollback.js';
import { run } from '../system/run.js';
import { describeRelease } from './add-package.js';
import { runProxy } from './proxy.js';

/** What both `abpv new` and `abpv switch-ui` do once the application is on disk. */
export interface FrontendOptions {
  /** Where the application was written. */
  frontend: string;
  /** The backend it was pointed at. */
  apiUrl: string;
  packageManager: string;
  skipProxy?: boolean | undefined;
  skipInstall?: boolean | undefined;
  /** Packages to take into the project, or `all`; nothing when the flag was not given. */
  withSourceCode?: readonly string[] | undefined;
  rollback?: Rollback | undefined;
  /** Told what happened, in the words the command prints. */
  notes: string[];
}

/**
 * Generates the proxy, if there is a backend to generate it from. Right after `abpv new`
 * there is not, and saying what to run is more useful than failing.
 */
export async function generateProxy(options: FrontendOptions): Promise<void> {
  if (options.skipProxy === true) return;

  const { reachable, detail, developmentCertificate } = await reachBackend(options.apiUrl);

  if (!reachable) {
    options.notes.push(
      `${detail}, so no proxy was generated. Start the backend and run: abpv proxy add --module all`,
    );
    return;
  }

  const result = await runProxy('add', {
    module: 'all',
    target: 'src/proxy',
    cwd: options.frontend,
    url: options.apiUrl,
    insecure: developmentCertificate,
  });

  options.notes.push(`Generated ${result.written.length} proxy files from ${options.apiUrl}.`);
}

export async function installDependencies(options: FrontendOptions): Promise<void> {
  const { packageManager } = options;

  if (options.skipInstall === true) {
    options.notes.push(`Dependencies were not installed. Run: ${packageManager} install`);
    return;
  }

  prompts.log.step(`${packageManager} install`);
  const { code } = await run(packageManager, ['install'], {
    cwd: options.frontend,
    stream: true,
    // Every Node package manager is a `.cmd` shim on Windows, which needs the shell.
    shell: process.platform === 'win32',
  });

  if (code !== 0) {
    options.notes.push(`${packageManager} install exited with ${code}; run it again.`);
  }
}

/**
 * Releases the sources the caller asked for at creation time. It reads `node_modules`, so
 * it can only run once the dependencies are there.
 */
export async function releaseAskedSources(options: FrontendOptions): Promise<void> {
  const packages = options.withSourceCode ?? [];
  if (packages.length === 0) return;

  if (options.skipInstall === true) {
    options.notes.push(
      `Nothing was installed, so there was no source to release. Install, then run: ` +
        `abpv add-package ${packages.join(',')} --with-source-code`,
    );
    return;
  }

  const result = await releaseSourceCode({
    project: options.frontend,
    packages,
    ...(options.rollback ? { rollback: options.rollback } : {}),
  });

  options.notes.push('Released into the project:', ...describeRelease(result));

  // The released source imports what its package depended on, and with pnpm's layout it
  // cannot see those from outside the package. They are dependencies of the project now.
  if (Object.keys(result.added).length > 0) await installDependencies(options);
}
