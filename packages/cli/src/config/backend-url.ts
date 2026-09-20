import { readProjectEnvironment } from './project-env.js';

/**
 * The backend an application is configured against, so `proxy add` needs no `--url` in a
 * project that already says where its backend is. Nothing is executed: the JSON is parsed
 * and the env files are read line by line.
 *
 * @param directory The project root to look in
 */
export async function inferBackendUrl(directory: string): Promise<string | undefined> {
  return (await readProjectEnvironment(directory)).apiUrl;
}
