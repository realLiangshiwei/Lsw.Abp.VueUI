import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import process from 'node:process';
import * as prompts from '@clack/prompts';
import { defineCommand } from 'citty';
import {
  readApiDefinition,
  readApplicationConfiguration,
  type ApiDefinitionSource,
} from '../api-definition/source.js';
import { inferBackendUrl } from '../config/backend-url.js';
import { readProxyConfig } from '../config/proxy-config.js';
import { CliError, isUserFacingError } from '../errors.js';
import { generateProxy } from '../generator/generate.js';
import { GenerationReport } from '../generator/report.js';
import { generatePage, pagePathsOf, type GeneratedFile } from '../page/generate.js';
import { readEntityPage, type EntityPage } from '../page/entity.js';
import { formatSource } from '../writer.js';

/** The options of `abpvue generate`, as the flags spell them. */
export interface GenerateArgs {
  entity?: string | undefined;
  cwd?: string | undefined;
  module?: string | undefined;
  target: string;
  proxy: string;
  routes: string;
  router?: boolean | undefined;
  resource?: string | undefined;
  route?: string | undefined;
  menu?: string | undefined;
  policy?: string | undefined;
  icon?: string | undefined;
  url?: string | undefined;
  source?: string | undefined;
  'config-source'?: string | undefined;
  token?: string | undefined;
  insecure?: boolean | undefined;
  force?: boolean | undefined;
  'dry-run'?: boolean | undefined;
}

export interface GenerateRunResult {
  page: EntityPage;
  files: GeneratedFile[];
  report: GenerationReport;
  dryRun: boolean;
}

/** Reads a file, or nothing when it is not there. */
async function readIfPresent(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return undefined;
  }
}

/**
 * Runs `abpvue generate`: asks the backend what the entity looks like, works out the
 * page from it, and writes the two files and the route.
 *
 * @param args The options, as the flags spell them
 */
export async function runGenerate(args: GenerateArgs): Promise<GenerateRunResult> {
  const entity = args.entity?.trim();
  if (!entity) throw new CliError('Which entity? Pass a name, e.g. `abpv generate Book`.');

  const cwd = args.cwd ?? process.cwd();
  const proxyTarget = isAbsolute(args.proxy) ? args.proxy : resolve(cwd, args.proxy);
  const proxyConfig = await readProxyConfig(proxyTarget);

  if (args.insecure) {
    // As in `proxy`: a local ABP backend serves a certificate Node does not trust, and
    // nothing in this process outlives the command.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const source: ApiDefinitionSource = {
    url: args.url ?? proxyConfig.source.url ?? (await inferBackendUrl(cwd)),
    file: args.source,
    token: args.token,
    insecure: args.insecure,
  };

  const definition = await readApiDefinition(source);
  const report = new GenerationReport();

  const modules = Object.keys(proxyConfig.modules);

  if (modules.length === 0) {
    throw new CliError(
      `There is no proxy in ${args.proxy}. A generated page is built on generated services, ` +
        'so run `abpv proxy add --module <name>` first.',
    );
  }

  // The same generation the proxy ran, replayed in memory: it is what says which name
  // each service and each DTO ended up with, renames included.
  const proxy = generateProxy({
    definition,
    modules,
    serviceType: proxyConfig.source.serviceType,
    rootNamespace: proxyConfig.source.rootNamespace,
    apiName: proxyConfig.source.apiName,
  });

  const resource = args.resource ?? (await defaultResource(args, source, report));
  const routesPath = args.router === false ? undefined : args.routes;

  const page = readEntityPage({
    definition,
    registry: proxy.registry,
    serviceNames: proxy.serviceNames,
    entity,
    module: args.module,
    resource,
    route: args.route,
    menu: args.menu,
    icon: args.icon,
    policy: args.policy,
    report,
  });

  const paths = pagePathsOf(page, args.target);
  const existing: Record<string, string> = {};

  for (const path of [paths.page, paths.extensions, ...(routesPath ? [routesPath] : [])]) {
    const found = await readIfPresent(join(cwd, path));
    if (found !== undefined) existing[path] = found;
  }

  const generated = generatePage({
    page,
    target: args.target,
    routesPath,
    existing,
    force: args.force,
    report,
  });

  // Formatting is what decides whether a file changed: the generator writes what
  // Prettier then lays out, and comparing before that would rewrite every file on
  // every run.
  const files = await Promise.all(
    generated.files.map(async file => {
      const content = await formatSource(join(cwd, file.path), file.content);
      const unchanged = file.action !== 'kept' && existing[file.path] === content;

      return { ...file, content, action: unchanged ? ('unchanged' as const) : file.action };
    }),
  );

  if (!args['dry-run']) {
    for (const file of files) {
      if (file.action === 'kept' || file.action === 'unchanged') continue;

      const path = join(cwd, file.path);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, file.content, 'utf8');
    }
  }

  return { page, files, report, dryRun: args['dry-run'] === true };
}

/** The localization resource the backend puts its own texts in. */
async function defaultResource(
  args: GenerateArgs,
  source: ApiDefinitionSource,
  report: GenerationReport,
): Promise<string | undefined> {
  try {
    const configuration = await readApplicationConfiguration({
      ...source,
      file: args['config-source'],
    });

    return configuration.localization?.defaultResourceName ?? undefined;
  } catch (error) {
    report.add(
      'skipped',
      `The application configuration could not be read (${(error as Error).message}), so the ` +
        'localization keys are named after the entity. Pass --resource to say what they are.',
    );

    return undefined;
  }
}

function print(result: GenerateRunResult): void {
  if (!result.report.isEmpty) {
    prompts.log.info(
      ['What the generation decided:', ...result.report.entries.map(e => `  - ${e.message}`)].join(
        '\n',
      ),
    );
  }

  const kept = result.files.filter(file => file.action === 'kept');

  if (kept.length > 0) {
    prompts.log.warn(
      [
        'Left alone, because they are already there:',
        ...kept.map(file => `  - ${file.path}`),
        'Pass --force to write the generated blocks again.',
      ].join('\n'),
    );
  }

  for (const file of result.files) {
    if (file.missingBlocks?.length) {
      prompts.log.warn(
        `${file.path} has no ${file.missingBlocks.join(', ')} block, so that part was not ` +
          'written. Put the markers back, or delete the file and generate it again.',
      );
    }
  }

  const touched = result.files.filter(
    file => file.action === 'created' || file.action === 'updated',
  );

  const verb = result.dryRun ? 'Would write' : 'Wrote';

  prompts.log.success(
    touched.length > 0
      ? `${verb}:\n${touched.map(file => `  - ${file.path} (${file.action})`).join('\n')}`
      : 'Nothing to write: everything is already as it would be generated.',
  );
}

async function guarded(args: GenerateArgs): Promise<void> {
  try {
    print(await runGenerate(args));
  } catch (error) {
    if (!isUserFacingError(error)) throw error;

    prompts.log.error(error.message);
    process.exit(1);
  }
}

export const generateCommand = defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate a CRUD page for one of the backend’s entities',
  },
  args: {
    entity: { type: 'positional', description: 'The entity, e.g. Book', required: false },
    module: {
      type: 'string',
      description: 'The api-definition module to look in',
      alias: 'm',
    },
    target: { type: 'string', description: 'Where the page goes', default: 'src/pages' },
    proxy: { type: 'string', description: 'Where the proxy is', default: 'src/proxy' },
    routes: {
      type: 'string',
      description: 'The file that declares the application routes',
      default: 'src/routes.ts',
    },
    router: { type: 'boolean', description: 'Add the route and the menu entry', default: true },
    resource: {
      type: 'string',
      description: "The localization resource; the backend's default when absent",
    },
    route: { type: 'string', description: 'The path the page is served at' },
    menu: { type: 'string', description: 'Localization key of the menu entry' },
    policy: {
      type: 'string',
      description: 'The base permission; .Create, .Update and .Delete are derived from it',
    },
    icon: { type: 'string', description: 'Icon class of the menu entry, e.g. bi bi-book' },
    url: { type: 'string', description: 'The backend; taken from the proxy when absent' },
    source: { type: 'string', description: 'A saved api-definition.json to generate from' },
    'config-source': {
      type: 'string',
      description: 'A saved application-configuration.json, alongside --source',
    },
    token: { type: 'string', description: 'Access token, for a backend that needs one' },
    insecure: {
      type: 'boolean',
      description: 'Accept the development certificate a local ABP backend serves',
      default: false,
    },
    force: {
      type: 'boolean',
      description: 'Write the generated blocks of files that are already there',
      default: false,
    },
    'dry-run': {
      type: 'boolean',
      description: 'Say what would change and write nothing',
      default: false,
    },
  },
  run: ({ args }) => guarded(args as unknown as GenerateArgs),
});
