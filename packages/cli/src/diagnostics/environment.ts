import process from 'node:process';
import { versionOf } from '../system/run.js';
import type { Check } from './checks.js';

/** What the packages are built for; also what the CLI itself declares in `engines`. */
const MINIMUM_NODE = 20;

export interface EnvironmentOptions {
  /** False when `--no-backend` means no .NET is involved. */
  backend?: boolean | undefined;
  /** The one that will be asked to install the dependencies. */
  packageManager?: string | undefined;
}

function nodeCheck(): Check {
  const version = process.versions.node;
  const major = Number(version.split('.')[0]);

  return major >= MINIMUM_NODE
    ? { name: 'node', status: 'ok', detail: version }
    : {
        name: 'node',
        status: 'fail',
        detail: `${version}; the packages are built for ${MINIMUM_NODE} or later`,
        fix: 'https://nodejs.org',
      };
}

/**
 * Whether the machine has what a run needs. `abpv new` stops on anything failing here;
 * `abpv doctor` prints the same lines and carries on.
 *
 * @param options Which parts of the toolchain this run actually uses
 */
export async function checkEnvironment(options: EnvironmentOptions = {}): Promise<Check[]> {
  const checks: Check[] = [nodeCheck()];

  if (options.packageManager) {
    const version = await versionOf(options.packageManager, ['--version']);
    checks.push(
      version
        ? { name: options.packageManager, status: 'ok', detail: version }
        : {
            name: options.packageManager,
            status: 'fail',
            detail: 'not on the PATH',
            fix: `npm install -g ${options.packageManager}`,
          },
    );
  }

  if (options.backend === false) return checks;

  const dotnet = await versionOf('dotnet', ['--version']);
  checks.push(
    dotnet
      ? { name: 'dotnet', status: 'ok', detail: dotnet }
      : {
          name: 'dotnet',
          status: 'fail',
          detail: 'no .NET SDK on the PATH',
          fix: 'https://dotnet.microsoft.com/download',
        },
  );

  // The official CLI is what generates the solution; this one only wraps it.
  const abp = await versionOf('abp', ['--version']);
  checks.push(
    abp
      ? { name: 'abp', status: 'ok', detail: abp }
      : {
          name: 'abp',
          status: 'fail',
          detail: 'the ABP CLI is not on the PATH',
          fix: 'dotnet tool install -g Volo.Abp.Studio.Cli',
        },
  );

  return checks;
}
