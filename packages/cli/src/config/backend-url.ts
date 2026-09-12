import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Where an application says which backend it talks to, in the order the runtime falls
 * back through them (decision D11).
 */
const SOURCES = ['public/dynamic-env.json', '.env.development.local', '.env.development', '.env'];

interface RuntimeConfig {
  apis?: Record<string, { url?: string } | undefined> | undefined;
}

/** The first `VITE_API_URL` an env file sets, ignoring comments. */
function apiUrlInEnvFile(text: string): string | undefined {
  for (const line of text.split('\n')) {
    const match = /^\s*VITE_API_URL\s*=\s*(.+?)\s*$/.exec(line);
    if (!match?.[1] || line.trimStart().startsWith('#')) continue;

    return match[1].replace(/^['"]|['"]$/g, '');
  }

  return undefined;
}

/**
 * The backend an application is configured against, so `proxy add` needs no `--url` in a
 * project that already says where its backend is. Nothing is executed: the JSON is
 * parsed and the env files are read line by line.
 *
 * @param directory The project root to look in
 */
export async function inferBackendUrl(directory: string): Promise<string | undefined> {
  for (const source of SOURCES) {
    let text: string;

    try {
      text = await readFile(join(directory, source), 'utf8');
    } catch {
      continue;
    }

    if (source.endsWith('.json')) {
      try {
        const config = JSON.parse(text) as RuntimeConfig;
        const url = config.apis?.default?.url;
        if (url) return url;
      } catch {
        // A malformed dynamic-env.json is the application's problem, not the generator's;
        // the next source may still say where the backend is.
      }
      continue;
    }

    const url = apiUrlInEnvFile(text);
    if (url) return url;
  }

  return undefined;
}
