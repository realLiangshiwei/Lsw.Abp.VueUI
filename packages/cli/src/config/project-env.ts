import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Where an application says which backend it talks to, in the order the runtime falls
 * back through them (decision D11). `src/env.ts` is the third level and is not read here:
 * it is TypeScript, and running a project's code to diagnose it is not worth what it costs.
 */
const SOURCES = ['public/dynamic-env.json', '.env.development.local', '.env.development', '.env'];

/** What a diagnosis needs to know about the application it is looking at. */
export interface ProjectEnvironment {
  apiUrl?: string | undefined;
  authUrl?: string | undefined;
  appUrl?: string | undefined;
  clientId?: string | undefined;
  scope?: string | undefined;
  redirectUri?: string | undefined;
}

interface RuntimeConfig {
  apis?: Record<string, { url?: string } | undefined> | undefined;
  application?: { baseUrl?: string } | undefined;
  oAuthConfig?: Record<string, string> | undefined;
}

/** The `VITE_*` values an env file sets, ignoring comments. */
function readEnvFile(text: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of text.split('\n')) {
    if (line.trimStart().startsWith('#')) continue;

    const match = /^\s*(VITE_[A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match?.[1] && match[2]) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }

  return values;
}

function fromRuntimeConfig(config: RuntimeConfig): ProjectEnvironment {
  const oAuth = config.oAuthConfig ?? {};

  return {
    apiUrl: config.apis?.default?.url,
    authUrl: oAuth.issuer,
    appUrl: config.application?.baseUrl,
    clientId: oAuth.clientId,
    scope: oAuth.scope,
    redirectUri: oAuth.redirectUri,
  };
}

/** The first value each source sets wins, which is the order the runtime resolves them in. */
function merge(into: ProjectEnvironment, from: ProjectEnvironment): ProjectEnvironment {
  for (const [key, value] of Object.entries(from)) {
    if (value && !into[key as keyof ProjectEnvironment]) {
      (into as Record<string, string>)[key] = value;
    }
  }

  return into;
}

/**
 * What an application is configured against, without running any of its code.
 * @param directory The project root to look in
 */
export async function readProjectEnvironment(directory: string): Promise<ProjectEnvironment> {
  const found: ProjectEnvironment = {};

  for (const source of SOURCES) {
    const text = await readFile(join(directory, source), 'utf8').catch(() => undefined);
    if (text === undefined) continue;

    if (source.endsWith('.json')) {
      try {
        merge(found, fromRuntimeConfig(JSON.parse(text) as RuntimeConfig));
      } catch {
        // A malformed dynamic-env.json is the application's problem; the next source may
        // still say where the backend is.
      }
      continue;
    }

    const values = readEnvFile(text);
    merge(found, {
      apiUrl: values.VITE_API_URL,
      authUrl: values.VITE_AUTH_URL,
      appUrl: values.VITE_APP_URL,
    });
  }

  return found;
}
