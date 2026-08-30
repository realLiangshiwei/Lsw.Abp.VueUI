import { AbpHttpError } from '@lsw-abpvue/core';
import { ref } from 'vue';

/** Filled in by the startup error handler, before any component exists to hold it. */
export const startupError = ref<string | null>(null);

const APP_URL = 'http://localhost:4200';

/**
 * The last of the three levels `loadRuntimeConfig` walks: what this build was born with.
 * A deployment overrides it with `public/dynamic-env.json`, or with `VITE_API_URL`.
 *
 * `responseType` is what picks the authentication flow, exactly as in an ABP Angular
 * application: `code` redirects to the identity server, anything else uses the password
 * form. Set `VITE_AUTH_RESPONSE_TYPE` in `.env.local` to try the other one.
 */
export const defaultEnvironment = {
  apis: { default: { url: 'https://localhost:44384' } },
  application: { name: 'BookStore', baseUrl: APP_URL },
  production: false,
  oAuthConfig: {
    issuer: 'https://localhost:44384',
    clientId: 'BookStore_App',
    scope: 'offline_access BookStore',
    redirectUri: APP_URL,
    postLogoutRedirectUri: APP_URL,
    responseType: import.meta.env.VITE_AUTH_RESPONSE_TYPE ?? 'code',
  },
};

export function describeStartupError(error: unknown): string {
  if (error instanceof AbpHttpError) {
    return error.isTransportFailure
      ? `Could not reach ${error.url}. Is the test backend running? See .claude/CLAUDE.md.`
      : `${error.status} from ${error.url}: ${error.error?.message ?? error.statusText}`;
  }

  return error instanceof Error ? error.message : String(error);
}
