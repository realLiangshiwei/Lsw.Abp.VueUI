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
  const wanted: [string, string, string][] = [
    ...(options.packageManager
      ? [
          [
            options.packageManager,
            'not on the PATH',
            `npm install -g ${options.packageManager}`,
          ] as [string, string, string],
        ]
      : []),
    ...(options.backend === false
      ? []
      : ([
          ['dotnet', 'no .NET SDK on the PATH', 'https://dotnet.microsoft.com/download'],
          // The official CLI is what generates the solution; this one only wraps it.
          ['abp', 'the ABP CLI is not on the PATH', 'dotnet tool install -g Volo.Abp.Studio.Cli'],
        ] as [string, string, string][])),
  ];

  // At the same time: `abp --version` alone takes seconds, and nothing here waits on
  // anything else.
  const versions = await Promise.all(wanted.map(([command]) => versionOf(command, ['--version'])));

  return [
    nodeCheck(),
    ...wanted.map(([name, missing, fix], index): Check => {
      const version = versions[index];

      return version
        ? { name, status: 'ok', detail: version }
        : { name, status: 'fail', detail: missing, fix };
    }),
  ];
}
