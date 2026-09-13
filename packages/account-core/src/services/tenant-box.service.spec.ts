import {
  AbpTenantService,
  ConfigStateService,
  createInjector,
  SessionStateService,
  type FindTenantResultDto,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { describe, expect, it, vi } from 'vitest';
import { TenantBoxService } from './tenant-box.service.js';

function tenantsAnswering(result: FindTenantResultDto): ProviderInput {
  return {
    provide: AbpTenantService,
    useValue: {
      findTenantByName: () => Promise.resolve(result),
      findTenantById: () => Promise.resolve(result),
    } as AbpTenantService,
  };
}

/** The refresh goes to the backend, which no unit test has. */
function configStateThatRefreshes(refresh = vi.fn(() => Promise.resolve())): ProviderInput {
  const injector = createInjector([]);
  const real = injector.get(ConfigStateService);

  return {
    provide: ConfigStateService,
    useValue: { ...real, refreshAppState: refresh } as unknown as ConfigStateService,
  };
}

describe('TenantBoxService', () => {
  it('sets the tenant a name resolves to and reloads the configuration', async () => {
    const refresh = vi.fn(() => Promise.resolve());
    const injector = createInjector([
      tenantsAnswering({ success: true, isActive: true, tenantId: 'id-1', name: 'acme' }),
      configStateThatRefreshes(refresh),
    ]);
    const service = injector.get(TenantBoxService);

    await expect(service.switchTo('acme')).resolves.toBe(true);

    expect(injector.get(SessionStateService).getTenant()).toEqual({
      id: 'id-1',
      name: 'acme',
      isAvailable: true,
    });
    expect(refresh).toHaveBeenCalledOnce();
    expect(service.currentTenant.value?.name).toBe('acme');
  });

  it('leaves the session alone when no tenant goes by that name', async () => {
    const refresh = vi.fn(() => Promise.resolve());
    const injector = createInjector([
      tenantsAnswering({ success: false, isActive: false }),
      configStateThatRefreshes(refresh),
    ]);
    const session = injector.get(SessionStateService);
    session.setTenant({ id: 'id-1', name: 'acme', isAvailable: true });

    await expect(injector.get(TenantBoxService).switchTo('nope')).resolves.toBe(false);

    expect(session.getTenant()?.name).toBe('acme');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('goes back to the host on an empty name', async () => {
    const refresh = vi.fn(() => Promise.resolve());
    const injector = createInjector([
      tenantsAnswering({ success: true, isActive: true, name: 'acme' }),
      configStateThatRefreshes(refresh),
    ]);
    const session = injector.get(SessionStateService);
    session.setTenant({ id: 'id-1', name: 'acme', isAvailable: true });

    await expect(injector.get(TenantBoxService).switchTo('')).resolves.toBe(true);

    expect(session.getTenant()).toBeNull();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
