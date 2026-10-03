import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { readApiDefinition, readApplicationConfiguration } from '../api-definition/source.js';
import { readProjectEnvironment, type ProjectEnvironment } from '../config/project-env.js';
import { readProxyConfig } from '../config/proxy-config.js';
import { generateProxy } from '../generator/generate.js';
import { readSourceCodeRecord } from '../source-code/record.js';
import { abpVersionIn } from '../solution/abp-version.js';
import { findSolutionUpwards, readSolution, type Solution } from '../solution/locate.js';
import { projectRootOf } from '../solution/layout.js';
import { reachBackend, type ReachResult } from './backend.js';
import { checkEnvironment } from './environment.js';
import { extensionCoverage } from './object-extensions.js';
import type { Check } from './checks.js';

/**
 * The ABP versions this release is tested against -- one per captured fixture set the
 * contract matrix runs against.
 */
const SUPPORTED_ABP = ['10.5', '10.6'];

export interface DoctorOptions {
  /** The application root. */
  project: string;
  /** The solution root; found upwards from the project when absent. */
  solution?: string | undefined;
  /** Makes the permission names comparable, the way `abpv proxy` uses one. */
  token?: string | undefined;
  /** Leaves out everything that needs the backend. */
  offline?: boolean | undefined;
  /**
   * Whether to look at this machine's toolchain. On by default; a caller that only wants
   * to know about the project can leave out a probe that spawns three programs.
   */
  environment?: boolean | undefined;
}

export interface DoctorResult {
  checks: Check[];
}

const ok = (name: string, detail: string): Check => ({ name, status: 'ok', detail });
const warn = (name: string, detail: string, fix?: string): Check => ({
  name,
  status: 'warn',
  detail,
  ...(fix ? { fix } : {}),
});
const fail = (name: string, detail: string, fix?: string): Check => ({
  name,
  status: 'fail',
  detail,
  ...(fix ? { fix } : {}),
});

/** Which one installed this project, so the advice names the command the user actually runs. */
async function packageManagerOf(project: string): Promise<string> {
  for (const [lockfile, manager] of [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
  ] as const) {
    if (
      await readFile(join(project, lockfile), 'utf8').then(
        () => true,
        () => false,
      )
    ) {
      return manager;
    }
  }

  return 'pnpm';
}

function configurationCheck(environment: ProjectEnvironment): Check {
  if (!environment.apiUrl) {
    return fail(
      'configuration',
      'nothing here says which backend to talk to',
      'Set apis.default.url in public/dynamic-env.json, or VITE_API_URL',
    );
  }

  return ok(
    'configuration',
    `${environment.apiUrl}${environment.clientId ? `, client ${environment.clientId}` : ''}`,
  );
}

/**
 * A backend on this machine serves the ASP.NET development certificate. Nothing is broken
 * -- the CLI accepted it to get an answer -- but a browser will not, and the user is
 * about to meet it.
 *
 * @param reach What asking the backend came to
 */
export function certificateCheck(reach: ReachResult): Check | undefined {
  if (!reach.developmentCertificate) return undefined;

  return warn(
    'https certificate',
    'the backend serves a certificate this machine does not trust',
    'dotnet dev-certs https --trust',
  );
}

/**
 * The preflight a browser sends before the first request. Failing it is the single most
 * common "it does not work": the page loads and every request is refused by the browser
 * before it leaves.
 */
async function corsCheck(apiUrl: string, origin: string | undefined): Promise<Check> {
  if (!origin) return warn('cors', 'the application does not say where it is served from');

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, '')}/api/abp/application-configuration`,
      {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
        signal: AbortSignal.timeout(5000),
      },
    );

    const allowed = response.headers.get('access-control-allow-origin');

    return allowed === origin || allowed === '*'
      ? ok('cors', `${origin} is allowed`)
      : fail(
          'cors',
          `${origin} is not in the allowed origins${allowed ? ` (${allowed} is)` : ''}`,
          `abpv switch-ui --port ${new URL(origin).port || '80'} --skip-proxy --skip-install`,
        );
  } catch (error) {
    return warn('cors', `the preflight could not be sent (${(error as Error).message})`);
  }
}

/** The identity server's own description of itself, which every authorization flow reads. */
async function discoveryCheck(authUrl: string): Promise<Check> {
  const url = `${authUrl.replace(/\/+$/, '')}/.well-known/openid-configuration`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      return fail('openid configuration', `${url} answered ${response.status}`);
    }

    const document = (await response.json()) as { authorization_endpoint?: string };

    return document.authorization_endpoint
      ? ok('openid configuration', authUrl)
      : fail('openid configuration', `${url} has no authorization_endpoint`);
  } catch (error) {
    return fail('openid configuration', `${url} did not answer (${(error as Error).message})`);
  }
}

/**
 * Whether the identity server has heard of the client the application is configured with.
 * A token request with nothing else in it is refused either way; which refusal it is
 * tells the two cases apart.
 */
async function clientCheck(authUrl: string, clientId: string | undefined): Promise<Check> {
  if (!clientId) return warn('openiddict client', 'the application names no client');

  try {
    const response = await fetch(`${authUrl.replace(/\/+$/, '')}/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'password', client_id: clientId }),
      signal: AbortSignal.timeout(5000),
    });

    const body = (await response.json()) as { error?: string };

    return body.error === 'invalid_client'
      ? fail(
          'openiddict client',
          `the identity server has no client called ${clientId}`,
          'Check OpenIddict:Applications in the DbMigrator settings, then run it again',
        )
      : ok('openiddict client', clientId);
  } catch (error) {
    return warn('openiddict client', `could not be asked (${(error as Error).message})`);
  }
}

/**
 * The redirect URIs are seeded from `RootUrl`, so this reads the solution rather than the
 * backend: nothing over HTTP says what the seeder was given.
 *
 * @param solution The solution the application sits in
 * @param settings The migrator's `appsettings.json`, as text
 * @param appUrl Where the application is served from
 */
export function redirectCheck(
  solution: Solution,
  settings: string,
  appUrl: string | undefined,
): Check {
  if (!appUrl) return warn('redirect uri', 'the application does not say where it is served from');

  const configured = settings.includes(appUrl);

  return configured
    ? ok('redirect uri', `${appUrl} is what the client was seeded with`)
    : fail(
        'redirect uri',
        `${appUrl} is not the RootUrl of ${solution.clientId}`,
        `abpv switch-ui --port ${new URL(appUrl).port || '80'} --skip-proxy --skip-install, then run the DbMigrator`,
      );
}

/**
 * What the two sides are, and whether this release has been tested against that ABP.
 *
 * @param abpVersion What the solution says it was generated for
 * @param packages The `@lsw-abpvue/*` versions the project has installed
 */
export function versionCheck(
  abpVersion: string | undefined,
  packages: Record<string, string>,
): Check {
  const ours = packages['@lsw-abpvue/core'] ?? '(not installed)';
  if (!abpVersion) return warn('versions', `@lsw-abpvue/core ${ours}; no ABP version found`);

  const minor = abpVersion.split('.').slice(0, 2).join('.');
  const detail = `ABP ${abpVersion}, @lsw-abpvue/core ${ours}`;

  return SUPPORTED_ABP.includes(minor)
    ? ok('versions', detail)
    : warn('versions', `${detail}; this release is tested against ${SUPPORTED_ABP.join(' and ')}`);
}

async function abpVersionOf(solution: Solution): Promise<string | undefined> {
  for (const root of new Set([projectRootOf(solution.root), solution.root])) {
    const text = await readFile(join(root, `${solution.name}.abpsln`), 'utf8').catch(
      () => undefined,
    );
    const version = text ? abpVersionIn(text) : undefined;
    if (version) return version;
  }
  return undefined;
}

/**
 * Whether the proxy on disk is what the backend describes today. The generation is run
 * again in memory and compared file by file, so nothing has to have been recorded for
 * this to work.
 */
async function proxyCheck(options: DoctorOptions, apiUrl: string): Promise<Check> {
  const target = join(options.project, 'src/proxy');
  const previous = await readProxyConfig(target);
  const modules = Object.keys(previous.modules);

  if (modules.length === 0) return warn('proxy', 'there is no generated proxy in src/proxy');

  const source = { url: apiUrl, token: options.token };
  const definition = await readApiDefinition(source);
  const configuration = await readApplicationConfiguration(source).catch(() => undefined);

  const generation = generateProxy({
    definition,
    modules,
    serviceType: previous.source.serviceType ?? 'application',
    rootNamespace: previous.source.rootNamespace,
    apiName: previous.source.apiName,
    index: previous.source.index,
    validators: previous.source.validators,
    policyNames: previous.source.policyNames,
    objectExtensions: configuration?.objectExtensions,
    grantedPolicies: Object.entries(configuration?.auth?.grantedPolicies ?? {})
      .filter(([, granted]) => granted)
      .map(([name]) => name),
  });

  // Without a token the permission names are the anonymous user's, which is a shorter
  // list than the one the file was generated from -- and the barrel that exports them
  // differs with it.
  const permissionDependent = ['policy-names.ts', 'index.ts'];

  const stale: string[] = [];
  for (const file of generation.files) {
    if (!options.token && permissionDependent.includes(file.path)) continue;

    const path = join(target, file.path);
    const current = await readFile(path, 'utf8').catch(() => undefined);
    const expected = await format(file.content, {
      ...(await resolveConfig(path)),
      filepath: path,
    }).catch(() => file.content);

    if (current !== expected) stale.push(file.path);
  }

  const note = options.token ? '' : '; the permission names need --token to be compared';

  return stale.length === 0
    ? ok('proxy', `${generation.files.length} files, up to date with ${apiUrl}${note}`)
    : warn(
        'proxy',
        `${stale.length} of ${generation.files.length} files are not what the backend describes: ${stale.slice(0, 3).join(', ')}${stale.length > 3 ? ' …' : ''}`,
        'abpv proxy refresh',
      );
}

function coverageCheck(configuration: Parameters<typeof extensionCoverage>[0]): Check {
  const coverage = extensionCoverage(configuration);
  if (coverage.declared === 0) return ok('object extensions', 'the backend extends nothing');

  const detail = `${coverage.declared} declared, ${coverage.recognised} recognised`;
  if (coverage.reported.length === 0) return ok('object extensions', detail);

  const lines = coverage.reported.map(entry => `${entry.path}: ${entry.reason}`);

  return warn(
    'object extensions',
    [detail, ...lines].join('\n  '),
    coverage.recognised < coverage.declared
      ? 'That is a gap in our mapping rules, not your configuration. Please open an issue.'
      : undefined,
  );
}

async function releasedCheck(project: string): Promise<Check> {
  const record = await readSourceCodeRecord(project);
  const released = Object.values(record.packages);

  return released.length === 0
    ? ok('released source', 'every package still follows its releases')
    : warn(
        'released source',
        released.map(entry => `${entry.name} ${entry.version} in ${entry.path}`).join('\n  '),
        'These do not follow an upgrade; bring fixes over by hand',
      );
}

/**
 * Diagnoses the handful of configuration mismatches almost every "it does not work" turns
 * out to be, and prints the command that fixes each one.
 *
 * @param options The project to look at, and how far to go
 */
export async function runDoctor(options: DoctorOptions): Promise<DoctorResult> {
  const { project } = options;
  const environment = await readProjectEnvironment(project);
  const checks: Check[] = [];

  if (options.environment !== false) {
    checks.push(...(await checkEnvironment({ packageManager: await packageManagerOf(project) })));
  }

  checks.push(configurationCheck(environment));

  const solution = await (
    options.solution
      ? readSolution(options.solution)
      : findSolutionUpwards(project).then(readSolution)
  ).catch(() => undefined);

  const apiUrl = environment.apiUrl ?? solution?.hostUrl;
  const authUrl = environment.authUrl ?? solution?.authUrl ?? apiUrl;

  if (!apiUrl || options.offline) {
    checks.push(warn('backend', 'not asked; there is no address, or --offline was given'));
  } else {
    const reach = await reachBackend(apiUrl);
    checks.push(reach.reachable ? ok('backend', reach.detail) : fail('backend', reach.detail));

    const certificate = certificateCheck(reach);
    if (certificate) checks.push(certificate);

    if (reach.reachable) {
      checks.push(await corsCheck(apiUrl, environment.appUrl));
      if (authUrl) {
        checks.push(
          await discoveryCheck(authUrl),
          await clientCheck(authUrl, environment.clientId),
        );
      }
    }
  }

  if (solution) {
    const settings = await readFile(
      join(solution.projects['DbMigrator'] ?? '', 'appsettings.json'),
      'utf8',
    ).catch(() => '');

    checks.push(
      redirectCheck(solution, settings, environment.appUrl),
      versionCheck(await abpVersionOf(solution), await installedVersions(project)),
    );
  } else {
    checks.push(warn('solution', `no ABP solution above ${project}, so it was not read`));
  }

  if (apiUrl && !options.offline) {
    checks.push(await proxyCheck(options, apiUrl).catch(error => warn('proxy', String(error))));

    const configuration = await readApplicationConfiguration({
      url: apiUrl,
      token: options.token,
    }).catch(() => undefined);

    if (configuration) checks.push(coverageCheck(configuration));
  }

  checks.push(await releasedCheck(project));

  return { checks };
}

/** What the project has installed of ours, read from the packages themselves. */
async function installedVersions(project: string): Promise<Record<string, string>> {
  const manifest = await readFile(join(project, 'package.json'), 'utf8').catch(() => '{}');
  const declared = JSON.parse(manifest) as { dependencies?: Record<string, string> };
  const versions: Record<string, string> = {};

  for (const name of Object.keys(declared.dependencies ?? {})) {
    if (!name.startsWith('@lsw-abpvue/')) continue;

    const installed = await readFile(
      join(project, 'node_modules', name, 'package.json'),
      'utf8',
    ).catch(() => undefined);

    versions[name] = installed
      ? ((JSON.parse(installed) as { version?: string }).version ?? '(unknown)')
      : (declared.dependencies?.[name] ?? '(not installed)');
  }

  return versions;
}
