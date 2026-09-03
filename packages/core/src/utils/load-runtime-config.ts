import { deepMerge, isPlainObject, type DeepPartial } from '@lsw-abpvue/utils';
import type { Environment } from '../models/environment.js';
import { DEFAULT_ENVIRONMENT } from '../models/root-options.js';
import type { FetchLike } from '../tokens/http.token.js';

export interface RuntimeConfigOptions {
  /** Where the deployed configuration lives. */
  url?: string | undefined;
  /** Tried when the first one is not there; ABP's own hosts serve this. */
  fallbackUrl?: string | undefined;
  /** The application's own built-in values, the last resort. */
  defaults?: DeepPartial<Environment> | undefined;
  /** Overridable so a test or a server renderer can supply its own transport. */
  fetch?: FetchLike | undefined;
  /**
   * Where the `VITE_*` values come from. Defaults to `import.meta.env`; a server
   * renderer passes `process.env` instead, since it has no bundler-injected one.
   */
  env?: Record<string, string | undefined> | undefined;
}

/**
 * The environment variables this reads. Everything else belongs in the JSON, which is
 * the point of the exercise: one build, many deployments.
 */
function fromEnvironmentVariables(
  variables: Record<string, string | undefined>,
): DeepPartial<Environment> {
  // Deeply partial, not `Partial`: naming only `baseUrl` here must not blank out the
  // application name the defaults carry.
  const config: DeepPartial<Environment> = {};

  if (variables.VITE_API_URL) config.apis = { default: { url: variables.VITE_API_URL } };
  if (variables.VITE_AUTH_URL) config.oAuthConfig = { issuer: variables.VITE_AUTH_URL };
  if (variables.VITE_APP_URL) config.application = { baseUrl: variables.VITE_APP_URL };

  return config;
}

async function readJson(
  fetchImpl: FetchLike,
  url: string,
): Promise<DeepPartial<Environment> | undefined> {
  try {
    const response = await fetchImpl(url);
    if (!response.ok) return undefined;

    // A single-page host answers an unknown path with index.html and a 200, so the
    // parse is the real test of whether the file is there.
    const parsed: unknown = await response.json();
    return isPlainObject(parsed) ? (parsed as DeepPartial<Environment>) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolves the environment at startup instead of baking it into the build, so the same
 * artifact can be deployed to staging and production with a different JSON file next to
 * it (decision D11).
 *
 * Three levels, each overriding the one before: the application's own defaults, the
 * `VITE_*` variables it was built with, and the deployed `dynamic-env.json`. Call it in
 * `main.ts` and hand the result to `withOptions({ environment })`.
 * @param options Where to look and what to fall back to
 */
export async function loadRuntimeConfig(options: RuntimeConfigOptions = {}): Promise<Environment> {
  const fetchImpl = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const variables =
    options.env ??
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env ??
    {};

  const withDefaults = deepMerge<Environment>(DEFAULT_ENVIRONMENT, options.defaults ?? {});
  const withVariables = deepMerge<Environment>(withDefaults, fromEnvironmentVariables(variables));

  const deployed =
    (await readJson(fetchImpl, options.url ?? '/dynamic-env.json')) ??
    (await readJson(fetchImpl, options.fallbackUrl ?? '/getEnvConfig'));

  return deployed ? deepMerge<Environment>(withVariables, deployed) : withVariables;
}
