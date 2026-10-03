import { AbpHttpError } from '@lsw-abpvue/core';

/** Filled in by the startup error handler, before any component exists to hold it. */
export const startupError = ref<string | null>(null);

export function describeStartupError(error: unknown): string {
  if (error instanceof AbpHttpError) {
    return error.isTransportFailure
      ? `Could not reach ${error.url}. Is the backend running? Run \`abpv doctor\` to find out why.`
      : `${error.status} from ${error.url}: ${error.error?.message ?? error.statusText}`;
  }

  return error instanceof Error ? error.message : String(error);
}
