import type { Environment } from './environment';

/** Everything a host can configure at the root, passed through `withOptions()`. */
export interface AbpRootOptions {
  environment: Environment;
  /** Skips the configuration request during startup; the host does it itself. */
  skipGetAppConfiguration?: boolean;
  skipInitAuthService?: boolean;
  /** Sends `null` query parameters instead of dropping them (Angular parity). */
  sendNullsAsQueryParam?: boolean;
  tenantKey?: string;
  othersGroup?: string;
  disableProjectNameInTitle?: boolean;
  /** Loads localization from files next to the app instead of the backend. */
  uiLocalization?: { enabled?: boolean; basePath?: string };
}

/** The same options with every default filled in, which is what services inject. */
export type ResolvedRootOptions = Required<
  Pick<
    AbpRootOptions,
    | 'environment'
    | 'skipGetAppConfiguration'
    | 'skipInitAuthService'
    | 'sendNullsAsQueryParam'
    | 'tenantKey'
    | 'othersGroup'
    | 'disableProjectNameInTitle'
  >
> &
  Pick<AbpRootOptions, 'uiLocalization'>;

export const DEFAULT_ENVIRONMENT: Environment = {
  apis: { default: { url: '' } },
  application: { name: 'ABP' },
  production: false,
};

export function resolveRootOptions(options: AbpRootOptions): ResolvedRootOptions {
  return {
    environment: options.environment,
    skipGetAppConfiguration: options.skipGetAppConfiguration ?? false,
    skipInitAuthService: options.skipInitAuthService ?? false,
    sendNullsAsQueryParam: options.sendNullsAsQueryParam ?? false,
    tenantKey: options.tenantKey ?? '__tenant',
    othersGroup: options.othersGroup ?? 'AbpUi::OthersGroup',
    disableProjectNameInTitle: options.disableProjectNameInTitle ?? false,
    ...(options.uiLocalization ? { uiLocalization: options.uiLocalization } : {}),
  };
}
