import { AbpHttpError } from '@lsw-abpvue/core';
import { ref } from 'vue';

/** Filled in by the startup error handler, before any component exists to hold it. */
export const startupError = ref<string | null>(null);

/**
 * The last of the three levels `loadRuntimeConfig` walks: what this build was born with.
 * A deployment overrides it with `public/dynamic-env.json`, or with `VITE_API_URL`.
 */
export const defaultEnvironment = {
  apis: { default: { url: 'https://localhost:44384' } },
  application: { name: 'BookStore' },
  production: false,
};

export function describeStartupError(error: unknown): string {
  if (error instanceof AbpHttpError) {
    return error.isTransportFailure
      ? `Could not reach ${error.url}. Is the test backend running? See .claude/CLAUDE.md.`
      : `${error.status} from ${error.url}: ${error.error?.message ?? error.statusText}`;
  }

  return error instanceof Error ? error.message : String(error);
}
