/**
 * The environment of a host application, field for field the same shape the Angular and
 * React UIs use, so an existing `environment.ts` can be moved over unchanged.
 */
export interface Environment {
  apis: Apis;
  application: ApplicationInfo;
  production: boolean;
  hmr?: boolean;
  test?: boolean;
  localization?: { defaultResourceName?: string };
  oAuthConfig?: OAuthConfig;
  remoteEnv?: RemoteEnv;
  /** Hosts put their own settings here; ABP itself never reads them. */
  [key: string]: unknown;
}

export interface ApplicationInfo {
  name: string;
  baseUrl?: string;
  logoUrl?: string;
}

export interface ApiConfig {
  url: string;
  rootNamespace?: string;
  /** Per-endpoint overrides, e.g. `{ Identity: 'https://identity.example.com' }`. */
  [key: string]: string | undefined;
}

export interface Apis {
  default: ApiConfig;
  [apiName: string]: Partial<ApiConfig> & { url?: string };
}

/**
 * The subset of the OIDC configuration `core` needs to know about. The authentication
 * package owns the rest and reads it from here.
 */
export interface OAuthConfig {
  issuer?: string;
  clientId?: string;
  scope?: string;
  responseType?: string;
  redirectUri?: string;
  postLogoutRedirectUri?: string;
  dummyClientSecret?: string;
  requireHttps?: boolean;
  impersonation?: { tenantImpersonation?: boolean; userImpersonation?: boolean };
  [key: string]: unknown;
}

export interface RemoteEnv {
  url: string;
  mergeStrategy: 'deepmerge' | 'overwrite';
  method?: string;
  headers?: Record<string, string>;
}
