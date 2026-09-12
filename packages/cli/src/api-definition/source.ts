import { readFile } from 'node:fs/promises';
import type { ApiDefinition } from './models.js';
import type { ApplicationConfiguration } from './object-extensions.js';

/**
 * `includeTypes` is not optional: without it the backend answers with an empty type
 * pool and there is nothing to generate from.
 */
export const API_DEFINITION_PATH = '/api/abp/api-definition?includeTypes=true';

/**
 * Where the object extension properties and their attributes are; the localization
 * resources are the bulk of the answer and the generator has no use for them.
 */
export const APPLICATION_CONFIGURATION_PATH =
  '/api/abp/application-configuration?includeLocalizationResources=false';

export interface ApiDefinitionSource {
  /** The backend to ask; ignored when `file` is set. */
  url?: string | undefined;
  /** A definition saved to disk, for working without a backend. */
  file?: string | undefined;
  /** Bearer token, for a backend that does not serve the endpoint anonymously. */
  token?: string | undefined;
  /** Accepts the development certificate an ABP backend serves on localhost. */
  insecure?: boolean | undefined;
  fetch?: typeof globalThis.fetch | undefined;
}

export class ApiDefinitionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ApiDefinitionError';
  }
}

function assertUsable(definition: ApiDefinition, origin: string): ApiDefinition {
  if (!definition.modules || Object.keys(definition.modules).length === 0) {
    throw new ApiDefinitionError(
      `${origin} describes no modules. The endpoint is there but nothing is exposed through it; ` +
        'check that the application registers its controllers as remote services.',
    );
  }

  if (!definition.types || Object.keys(definition.types).length === 0) {
    throw new ApiDefinitionError(
      `${origin} describes no types. That is what the endpoint answers without includeTypes=true, ` +
        'and there is nothing to generate models from.',
    );
  }

  return definition;
}

async function readFromDisk(file: string): Promise<ApiDefinition> {
  let text: string;

  try {
    text = await readFile(file, 'utf8');
  } catch (cause) {
    throw new ApiDefinitionError(`Cannot read ${file}.`, { cause });
  }

  try {
    return assertUsable(JSON.parse(text) as ApiDefinition, file);
  } catch (cause) {
    if (cause instanceof ApiDefinitionError) throw cause;
    throw new ApiDefinitionError(`${file} is not valid JSON.`, { cause });
  }
}

async function readFromBackend(source: ApiDefinitionSource): Promise<ApiDefinition> {
  const url = `${(source.url ?? '').replace(/\/+$/, '')}${API_DEFINITION_PATH}`;
  const send = source.fetch ?? globalThis.fetch;
  let response: Response;

  try {
    response = await send(url, {
      headers: source.token ? { Authorization: `Bearer ${source.token}` } : {},
    });
  } catch (cause) {
    throw new ApiDefinitionError(
      `Cannot reach ${url}. Start the backend, or pass --source with a saved definition. ` +
        'A development certificate needs --insecure.',
      { cause },
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new ApiDefinitionError(
      `${url} answered ${response.status}. The endpoint is not anonymous on this backend; ` +
        'pass an access token with --token.',
    );
  }

  if (!response.ok) {
    throw new ApiDefinitionError(
      `${url} answered ${response.status}. ABP serves the endpoint from ` +
        'Volo.Abp.AspNetCore.Mvc; a 404 means the module is not in the application.',
    );
  }

  return assertUsable((await response.json()) as ApiDefinition, url);
}

/**
 * The API definition, from a running backend or from a file.
 * @param source Where to read it from
 */
export async function readApiDefinition(source: ApiDefinitionSource): Promise<ApiDefinition> {
  if (source.file) return readFromDisk(source.file);

  if (!source.url) {
    throw new ApiDefinitionError(
      'No backend to read from. Pass --url, or --source with a saved definition.',
    );
  }

  return readFromBackend(source);
}

async function readJson<T>(source: ApiDefinitionSource, path: string): Promise<T> {
  if (source.file) {
    try {
      return JSON.parse(await readFile(source.file, 'utf8')) as T;
    } catch (cause) {
      throw new ApiDefinitionError(`Cannot read ${source.file}.`, { cause });
    }
  }

  const url = `${(source.url ?? '').replace(/\/+$/, '')}${path}`;
  const send = source.fetch ?? globalThis.fetch;

  try {
    const response = await send(url, {
      headers: source.token ? { Authorization: `Bearer ${source.token}` } : {},
    });

    if (!response.ok) throw new ApiDefinitionError(`${url} answered ${response.status}.`);

    return (await response.json()) as T;
  } catch (cause) {
    if (cause instanceof ApiDefinitionError) throw cause;
    throw new ApiDefinitionError(`Cannot reach ${url}.`, { cause });
  }
}

/**
 * The application configuration, which is where the object extension properties and the
 * permission names are. Anonymous is enough for the extensions; the permission names a
 * user has are only there once there is a token.
 * @param source Where to read it from
 */
export async function readApplicationConfiguration(
  source: ApiDefinitionSource,
): Promise<ApplicationConfiguration & { auth?: { grantedPolicies?: Record<string, boolean> } }> {
  return readJson(source, APPLICATION_CONFIGURATION_PATH);
}
