import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { parse } from 'jsonc-parser';
import { CliError } from '../errors.js';

/** What was found in a generated or existing ABP solution. */
export interface Solution {
  /** The directory holding the solution file, `src/` and `test/`. */
  root: string;
  /** The solution name, e.g. `Acme.BookStore`. */
  name: string;
  /** What ABP calls the project: the last segment, e.g. `BookStore`. */
  appName: string;
  /** Project directories, by the suffix that names them. */
  projects: Record<string, string>;
  /** Where the API is served, from the host's launch settings. */
  hostUrl: string;
  /** The identity server: a separate project when there is one, the host otherwise. */
  authUrl: string;
  /** The OpenIddict client the frontend is meant to use, from the migrator's settings. */
  clientId: string;
}

const SOLUTION_FILE = /\.slnx?$/;

async function entries(dir: string): Promise<string[]> {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

/** The solution file in a directory, if it has exactly one to speak of. */
async function solutionFileIn(dir: string): Promise<string | undefined> {
  const found = (await entries(dir)).filter(name => SOLUTION_FILE.test(name)).sort();

  // `abp new` writes both `.slnx` and, for older templates, `.sln`; either names the same
  // solution, so the first one is as good as the other.
  return found[0];
}

/**
 * The solution at or below a directory. One level down is where `-csf` puts it, which is
 * how `abpv new` finds what it just asked the official CLI to create.
 *
 * @param from The directory to look in
 * @param preferred The name to pick when a directory holds more than one solution
 */
export async function findSolutionRoot(
  from: string,
  preferred?: string | undefined,
): Promise<string> {
  if (await solutionFileIn(from)) return from;

  const candidates: string[] = [];
  for (const entry of await entries(from)) {
    const child = join(from, entry);
    if (await solutionFileIn(child)) candidates.push(child);
  }

  const chosen = candidates.find(path => basename(path) === preferred) ?? candidates[0];
  if (!chosen) throw new CliError(`No ABP solution in ${from} or the directories below it.`);

  return chosen;
}

/** The https address a project's launch profile serves on. */
async function launchUrl(projectDir: string): Promise<string | undefined> {
  const settings = parse(
    await readFile(join(projectDir, 'Properties/launchSettings.json'), 'utf8').catch(() => ''),
  ) as { profiles?: Record<string, { applicationUrl?: string; commandName?: string }> } | undefined;

  const profiles = Object.values(settings?.profiles ?? {}).filter(
    profile => profile.commandName === 'Project',
  );

  for (const profile of profiles) {
    // `applicationUrl` may name both schemes; the frontend talks to the secure one.
    const url = profile.applicationUrl?.split(';').find(entry => entry.startsWith('https://'));
    if (url) return url;
  }

  return undefined;
}

/** The `{Project}_App` client, which is the one an ABP solution creates for its SPA. */
async function clientIdOf(migratorDir: string | undefined, appName: string): Promise<string> {
  const fallback = `${appName}_App`;
  if (!migratorDir) return fallback;

  const settings = parse(
    await readFile(join(migratorDir, 'appsettings.json'), 'utf8').catch(() => ''),
  ) as { OpenIddict?: { Applications?: Record<string, { ClientId?: string }> } } | undefined;

  const applications = settings?.OpenIddict?.Applications ?? {};
  const app = Object.entries(applications).find(([name]) => name.endsWith('_App'));

  return app?.[1].ClientId ?? app?.[0] ?? fallback;
}

/**
 * Reads what the frontend needs to know about a solution: where its API is, where its
 * identity server is, and which OpenIddict client it should use.
 *
 * @param root The solution root
 */
export async function readSolution(root: string): Promise<Solution> {
  const file = await solutionFileIn(root);
  if (!file) throw new CliError(`${root} holds no ABP solution.`);

  const name = file.replace(SOLUTION_FILE, '');
  const appName = name.split('.').at(-1) ?? name;

  const projects: Record<string, string> = {};
  for (const entry of await entries(join(root, 'src'))) {
    const suffix = entry.startsWith(`${name}.`) ? entry.slice(name.length + 1) : entry;
    projects[suffix] = join(root, 'src', entry);
  }

  const host = projects['HttpApi.Host'];
  if (!host) {
    throw new CliError(
      `${root} has no HttpApi.Host project, so there is no API for a frontend to talk to.`,
    );
  }

  const hostUrl = await launchUrl(host);
  if (!hostUrl) {
    throw new CliError(`No https address in the launch settings of ${host}.`);
  }

  const authServer = projects['AuthServer'];

  return {
    root,
    name,
    appName,
    projects,
    hostUrl,
    authUrl: (authServer ? await launchUrl(authServer) : undefined) ?? hostUrl,
    clientId: await clientIdOf(projects['DbMigrator'], appName),
  };
}
