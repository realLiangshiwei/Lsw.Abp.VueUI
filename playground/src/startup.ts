import { AbpHttpError, type Environment } from '@lsw-abpvue/core';
import { ref } from 'vue';

/** Filled in by the startup error handler, before any component exists to hold it. */
export const startupError = ref<string | null>(null);

export const environment: Environment = {
  apis: { default: { url: import.meta.env.VITE_ABP_API_URL } },
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
