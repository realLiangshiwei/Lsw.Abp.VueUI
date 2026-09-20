import process from 'node:process';
import * as prompts from '@clack/prompts';
import { reachBackend } from '../diagnostics/backend.js';
import { run } from '../system/run.js';
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
