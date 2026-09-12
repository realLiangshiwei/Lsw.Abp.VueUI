import { rm } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { join } from 'node:path';
import process from 'node:process';
import * as prompts from '@clack/prompts';
import { defineCommand } from 'citty';
import type { ApiDefinition } from '../api-definition/models.js';
import {
  readApiDefinition,
  readApplicationConfiguration,
  type ApiDefinitionSource,
} from '../api-definition/source.js';
import { inferBackendUrl } from '../config/backend-url.js';
import {
  PROXY_CONFIG_FILE,
  readProxyConfig,
  writeProxyConfig,
  type ProxyConfig,
} from '../config/proxy-config.js';
import { CliError, isUserFacingError } from '../errors.js';
import { generateProxy, type ServiceType } from '../generator/generate.js';
import { GenerationReport } from '../generator/report.js';
import { writeProxy } from '../writer.js';

export type ProxyAction = 'add' | 'refresh' | 'remove';

/** The options of `abpvue proxy`, as the flags spell them. */
export interface ProxyArgs {
  module?: string | undefined;
  target: string;
  /** Where the command runs; the project whose backend and configuration are read. */
  cwd?: string | undefined;
  url?: string | undefined;
  source?: string | undefined;
  'config-source'?: string | undefined;
  token?: string | undefined;
  insecure?: boolean | undefined;
  'service-type'?: string | undefined;
  'root-namespace'?: string | undefined;
  'api-name'?: string | undefined;
  index?: boolean | undefined;
  validators?: boolean | undefined;
  'policy-names'?: boolean | undefined;
  'dry-run'?: boolean | undefined;
}

export interface ProxyRunResult {
  written: string[];
  removed: string[];
  modules: string[];
  report: GenerationReport;
}

const sharedArgs = {
  target: { type: 'string', description: 'Where to write the proxy', default: 'src/proxy' },
  url: {
    type: 'string',
    description: 'The backend; taken from dynamic-env.json or VITE_API_URL when absent',
  },
  source: {
    type: 'string',
    description: 'A saved api-definition.json to generate from instead of a backend',
  },
  'config-source': {
    type: 'string',
    description: 'A saved application-configuration.json, alongside --source',
  },
  token: {
    type: 'string',
    description: 'Access token; also what makes the permission names complete',
  },
  insecure: {
    type: 'boolean',
    description: 'Accept the development certificate a local ABP backend serves',
    default: false,
  },
  'service-type': {
    type: 'string',
    description: 'application, integration or all',
    default: 'application',
  },
  'root-namespace': {
    type: 'string',
    description: 'The project namespace to take off the front of the generated directories',
  },
  'api-name': {
    type: 'string',
    description: 'Overrides the remote service name the services are generated with',
  },
  index: { type: 'boolean', description: 'Write the barrel files', default: true },
  validators: { type: 'boolean', description: 'Write the validator maps', default: true },
  'policy-names': { type: 'boolean', description: 'Write the permission names', default: true },
  'dry-run': {
    type: 'boolean',
    description: 'Say what would change and write nothing',
    default: false,
  },
} as const;

function serviceTypeOf(args: ProxyArgs): ServiceType {
  const value = args['service-type'] ?? 'application';
  if (value === 'application' || value === 'integration' || value === 'all') return value;

  throw new CliError(`--service-type is application, integration or all, not "${value}".`);
}

/** The modules the run should end with; everything is generated from this list. */
function modulesFor(action: ProxyAction, requested: string[], previous: ProxyConfig): string[] {
  const recorded = Object.keys(previous.modules);

  if (action === 'add') return [...new Set([...recorded, ...requested])].sort();
  if (action === 'remove') return recorded.filter(name => !requested.includes(name));

  return (requested.length > 0 ? requested : recorded).sort();
}

async function chooseModules(definition: ApiDefinition): Promise<string[]> {
  if (!process.stdout.isTTY) {
    throw new CliError(
      `Which module? Pass --module with one of: ${Object.keys(definition.modules).join(', ')}, or "all".`,
    );
  }

  const chosen = await prompts.multiselect({
    message: 'Which modules?',
    options: Object.keys(definition.modules).map(name => ({ value: name, label: name })),
  });

  if (prompts.isCancel(chosen) || (chosen as string[]).length === 0) {
    throw new CliError('Nothing was chosen, so nothing was generated.');
  }

  return chosen as string[];
}

/**
 * Runs one `abpvue proxy` command: reads what is there, asks the backend, generates, and
 * replaces the directory's contents with the result.
 *
 * @param action Which of the three commands
 * @param args The options, as the flags spell them
 */
export async function runProxy(action: ProxyAction, args: ProxyArgs): Promise<ProxyRunResult> {
  const cwd = args.cwd ?? process.cwd();
  const target = isAbsolute(args.target) ? args.target : resolve(cwd, args.target);
  const previous = await readProxyConfig(target);

  if (args.insecure) {
    // A local ABP backend serves the ASP.NET development certificate, which Node does
    // not trust. Nothing else in this process outlives the command.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const source: ApiDefinitionSource = {
    url: args.url ?? previous.source.url ?? (await inferBackendUrl(cwd)),
    file: args.source,
    token: args.token,
    insecure: args.insecure,
  };

  const requested = (args.module ?? '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);

  if (action === 'remove' && requested.length === 0) {
    const recorded = Object.keys(previous.modules);
    throw new CliError(
      recorded.length > 0
        ? `Which module? Pass --module with one of: ${recorded.join(', ')}.`
        : `There is no proxy in ${args.target} to remove anything from.`,
    );
  }

  const definition = await readApiDefinition(source);

  let modules = modulesFor(action, requested, previous);
  if (action !== 'remove' && modules.length === 0) modules = await chooseModules(definition);

  const report = new GenerationReport();
  const configuration = await readConfiguration(args, source, report);

  const generation =
    modules.length > 0
      ? generateProxy({
          definition,
          modules,
          serviceType: serviceTypeOf(args),
          rootNamespace: args['root-namespace'],
          apiName: args['api-name'],
          index: args.index,
          validators: args.validators,
          policyNames: args['policy-names'],
          objectExtensions: configuration?.objectExtensions,
          grantedPolicies: Object.entries(configuration?.auth?.grantedPolicies ?? {})
            .filter(([, granted]) => granted)
            .map(([name]) => name),
        })
      : undefined;

  // `all` is an instruction, not a module: what gets recorded is what it expanded to, so
  // the next refresh generates the same thing rather than whatever the backend has grown.
  const generated = generation?.modules ?? modules;

  const written = await writeProxy({
    target,
    files: generation?.files ?? [],
    previous: previous.generated,
    dryRun: args['dry-run'],
  });

  for (const entry of generation?.report.entries ?? []) report.add(entry.kind, entry.message);

  if (!args['dry-run']) {
    if (generation) {
      await writeProxyConfig(target, {
        generated: written.written,
        removed: written.removed,
        modules: Object.fromEntries(
          generated.map(name => [
            name,
            {
              rootPath: definition.modules[name]?.rootPath ?? name,
              remoteServiceName: definition.modules[name]?.remoteServiceName ?? '',
            },
          ]),
        ),
        source: {
          url: source.url,
          serviceType: serviceTypeOf(args),
          rootNamespace: args['root-namespace'],
          apiName: args['api-name'],
          index: args.index,
          validators: args.validators,
          policyNames: args['policy-names'],
        },
      });
    } else {
      // Nothing is left: the directory should not keep a lock file for a proxy that is gone.
      await rm(join(target, PROXY_CONFIG_FILE), { force: true });
    }
  }

  return { ...written, modules: generated, report };
}

/**
 * The application configuration, which the validators and the permission names come
 * from. Working from a saved definition without a saved configuration is a supported
 * state, and the report says what it costs.
 */
async function readConfiguration(
  args: ProxyArgs,
  source: ApiDefinitionSource,
  report: GenerationReport,
): Promise<Awaited<ReturnType<typeof readApplicationConfiguration>> | undefined> {
  if (args.validators === false && args['policy-names'] === false) return undefined;

  const file = args['config-source'];
  if (args.source && !file) {
    report.add(
      'skipped',
      'Generating from a saved definition without a saved application-configuration: pass ' +
        '--config-source for the object extension validators and the permission names.',
    );
    return undefined;
  }

  try {
    return await readApplicationConfiguration({ ...source, file });
  } catch (error) {
    report.add(
      'skipped',
      `The application configuration could not be read (${(error as Error).message}), so the ` +
        'object extension validators and the permission names were left out.',
    );
    return undefined;
  }
}

function print(result: ProxyRunResult, args: ProxyArgs): void {
  if (!result.report.isEmpty) {
    prompts.log.info(
      [
        'What the generation decided:',
        ...result.report.entries.map(entry => `  - ${entry.message}`),
      ].join('\n'),
    );
  }

  const verb = args['dry-run'] ? 'Would write' : 'Wrote';
  prompts.log.success(
    `${verb} ${result.written.length} files to ${args.target}` +
      (result.removed.length > 0 ? `, and remove ${result.removed.length}` : '') +
      (result.modules.length > 0 ? ` (${result.modules.join(', ')})` : ''),
  );
}

/**
 * citty prints whatever escapes a command with its stack. A failure the message already
 * explains -- an unreachable backend, a module the backend does not have -- is not a bug
 * report, so it stops here.
 */
async function guarded(action: ProxyAction, args: ProxyArgs): Promise<void> {
  try {
    print(await runProxy(action, args), args);
  } catch (error) {
    if (!isUserFacingError(error)) throw error;

    prompts.log.error(error.message);
    process.exit(1);
  }
}

const moduleArg = {
  type: 'string',
  description: 'Module name, comma separated, or all',
  alias: 'm',
} as const;

export const proxyCommand = defineCommand({
  meta: { name: 'proxy', description: 'Generate typed proxies from a running ABP backend' },
  subCommands: {
    add: defineCommand({
      meta: { name: 'add', description: 'Generate the proxy of one or more modules' },
      args: { module: moduleArg, ...sharedArgs },
      run: ({ args }) => guarded('add', args as unknown as ProxyArgs),
    }),

    refresh: defineCommand({
      meta: { name: 'refresh', description: 'Generate again what is already recorded' },
      args: { module: moduleArg, ...sharedArgs },
      run: ({ args }) => guarded('refresh', args as unknown as ProxyArgs),
    }),

    remove: defineCommand({
      meta: { name: 'remove', description: 'Take a module out and generate the rest again' },
      args: { module: moduleArg, ...sharedArgs },
      run: ({ args }) => guarded('remove', args as unknown as ProxyArgs),
    }),
  },
});
