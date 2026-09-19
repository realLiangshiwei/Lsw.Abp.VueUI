/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the ABP backend, the second of `loadRuntimeConfig`'s three levels. */
  readonly VITE_API_URL: string;
  /** Base URL of the identity server; the same host unless the solution is separated. */
  readonly VITE_AUTH_URL: string;
  /** Where this application is served from, which is also its OAuth redirect URI. */
  readonly VITE_APP_URL: string;
}
