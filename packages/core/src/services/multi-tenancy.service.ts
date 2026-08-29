import type { ComputedRef } from 'vue';
import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import type { Environment } from '../models/environment';
import { AbpTenantService } from '../proxy/abp-tenant.service';
import type { CurrentTenantDto, FindTenantResultDto } from '../proxy/models';
import { TENANT_KEY } from '../tokens/tenant-key.token';
import { InternalStore } from '../utils/internal-store';
import { ConfigStateService } from './config-state.service';
import { EnvironmentService } from './environment.service';
import { WindowService } from './platform/window.service';
import { SessionStateService } from './session-state.service';

const PLACEHOLDER = '{0}';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Reads the tenant out of a hostname built from a template, so `https://{0}.abp.io` and
 * `https://acme.abp.io/books` yield `acme`.
 */
export function tenancyNameFromUrl(baseUrl: string, href: string): string | undefined {
  if (!baseUrl.includes(PLACEHOLDER)) return undefined;

  const pattern = baseUrl.split(PLACEHOLDER).map(escapeRegExp).join('(.+?)');
  return new RegExp(`^${pattern}`).exec(href)?.[1] || undefined;
}

/** Every URL in the environment carries the same placeholder and has to be filled in. */
function withTenancyName(environment: Environment, name: string, placeholder: string): Environment {
  const replace = (value: string | undefined) =>
    value === undefined ? undefined : value.split(placeholder).join(name);

  const apis = Object.fromEntries(
    Object.entries(environment.apis).map(([apiName, api]) => [
      apiName,
      Object.fromEntries(Object.entries(api).map(([key, value]) => [key, replace(value)])),
    ]),
  ) as Environment['apis'];

  return {
    ...environment,
    apis,
    application: { ...environment.application, baseUrl: replace(environment.application.baseUrl) },
    ...(environment.oAuthConfig
      ? {
          oAuthConfig: {
            ...environment.oAuthConfig,
            issuer: replace(environment.oAuthConfig.issuer),
            redirectUri: replace(environment.oAuthConfig.redirectUri),
          },
        }
      : {}),
  };
}

function toCurrentTenant(result: FindTenantResultDto): CurrentTenantDto | null {
  if (!result.success) return null;

  return {
    ...(result.tenantId !== undefined ? { id: result.tenantId } : {}),
    ...(result.name !== undefined ? { name: result.name } : {}),
    isAvailable: true,
  };
}

export const MultiTenancyService = defineService('MultiTenancyService', () => {
  const configState = inject(ConfigStateService);
  const session = inject(SessionStateService);
  const environmentService = inject(EnvironmentService);
  const tenants = inject(AbpTenantService);
  const windowService = inject(WindowService);
  const tenantKey = inject(TENANT_KEY);
  const domain = new InternalStore<{ tenant: CurrentTenantDto | null }>({ tenant: null });

  async function setTenant(
    find: () => Promise<FindTenantResultDto>,
  ): Promise<CurrentTenantDto | null> {
    const tenant = toCurrentTenant(await find());
    session.setTenant(tenant);
    return tenant;
  }

  return {
    isEnabled: configState.getDeep<boolean>('multiTenancy.isEnabled'),
    currentTenant: session.getTenant$(),
    /** Set when the host name itself named a tenant, which pins the whole session to it. */
    domainTenant: domain.slice(state => state.tenant) as ComputedRef<CurrentTenantDto | null>,

    setTenantByName: (name: string): Promise<CurrentTenantDto | null> =>
      setTenant(() => tenants.findTenantByName(name)),

    setTenantById: (id: string): Promise<CurrentTenantDto | null> =>
      setTenant(() => tenants.findTenantById(id)),

    /**
     * Works out the tenant from the address bar, in the order ABP defines: the
     * placeholder in `application.baseUrl`, then the `__tenant` query parameter. What is
     * already in storage stays if neither says anything.
     */
    resolveFromUrl: async (): Promise<void> => {
      const href = windowService.nativeWindow?.location.href;
      if (!href) return;

      const environment = environmentService.getEnvironment();
      const name = tenancyNameFromUrl(environment.application.baseUrl ?? '', href);

      if (name) {
        // The placeholder has to go before anything is requested: the tenant lookup
        // itself would otherwise be sent to a host called `{0}`.
        environmentService.setState(withTenancyName(environment, name, PLACEHOLDER));
        domain.patch({ tenant: await setTenant(() => tenants.findTenantByName(name)) });
        return;
      }

      // No tenant in the host name, so the placeholder and its dot come out entirely.
      environmentService.setState(withTenancyName(environment, '', `${PLACEHOLDER}.`));

      const fromQuery = new URL(href).searchParams.get(tenantKey);
      if (fromQuery) await setTenant(() => tenants.findTenantById(fromQuery));
    },
  };
});
export type MultiTenancyService = ServiceOf<typeof MultiTenancyService>;

export const useMultiTenancy = (): MultiTenancyService => inject(MultiTenancyService);
