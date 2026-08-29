/**
 * The environment of a host application, field for field the same shape the Angular and
 * React UIs use, so an existing `environment.ts` can be moved over unchanged.
 */
export interface Environment {
  apis: Apis;
  application: ApplicationInfo;
  production: boolean;
  hmr?: boolean | undefined;
  test?: boolean | undefined;
  localization?: { defaultResourceName?: string | undefined } | undefined;
  oAuthConfig?: OAuthConfig | undefined;
  remoteEnv?: RemoteEnv | undefined;
  /** Hosts put their own settings here; ABP itself never reads them. */
  [key: string]: unknown;
}

export interface ApplicationInfo {
  name: string;
  baseUrl?: string | undefined;
  logoUrl?: string | undefined;
}

export interface ApiConfig {
  url: string;
  rootNamespace?: string | undefined;
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
  issuer?: string | undefined;
  clientId?: string | undefined;
  scope?: string | undefined;
  responseType?: string | undefined;
  redirectUri?: string | undefined;
  postLogoutRedirectUri?: string | undefined;
  dummyClientSecret?: string | undefined;
  requireHttps?: boolean | undefined;
  impersonation?:
    | { tenantImpersonation?: boolean | undefined; userImpersonation?: boolean | undefined }
    | undefined;
  [key: string]: unknown;
}

export interface RemoteEnv {
  url: string;
  mergeStrategy: 'deepmerge' | 'overwrite';
  method?: string | undefined;
  headers?: Record<string, string> | undefined;
}
