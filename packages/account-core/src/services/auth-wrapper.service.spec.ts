import {
  ConfigStateService,
  createInjector,
  MultiTenancyService,
  type ApplicationConfigurationDto,
  type CurrentTenantDto,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { computed, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { AuthWrapperService } from './auth-wrapper.service.js';

function configured(
  state: Partial<ApplicationConfigurationDto>,
  providers: ProviderInput[] = [],
): Injector {
  const injector = createInjector(providers);
  const configState = injector.get(ConfigStateService);
  configState.setState({ ...configState.snapshot(), ...state } as ApplicationConfigurationDto);

  return injector;
}

/** Everything `AuthWrapperService` reads from multi-tenancy, and nothing else. */
function multiTenancy(isEnabled: boolean, domainTenant: CurrentTenantDto | null): ProviderInput {
  return {
    provide: MultiTenancyService,
    useValue: {
      isEnabled: computed(() => isEnabled),
      domainTenant: computed(() => domainTenant),
      currentTenant: ref(null),
    } as unknown as MultiTenancyService,
  };
}

describe('AuthWrapperService', () => {
  it('takes a setting the backend never wrote as enabled', () => {
    const service = createInjector([]).get(AuthWrapperService);

    expect(service.isLocalLoginEnabled.value).toBe(true);
    expect(service.isSelfRegistrationEnabled.value).toBe(true);
  });

  it('turns a scheme off only when the backend says false', () => {
    const service = configured({
      setting: {
        values: {
          'Abp.Account.EnableLocalLogin': 'False',
          'Abp.Account.IsSelfRegistrationEnabled': 'false',
        },
      },
    }).get(AuthWrapperService);

    expect(service.isLocalLoginEnabled.value).toBe(false);
    expect(service.isSelfRegistrationEnabled.value).toBe(false);
  });

  it('follows a setting that changes after a tenant switch', () => {
    const injector = createInjector([]);
    const configState = injector.get(ConfigStateService);
    const service = injector.get(AuthWrapperService);

    expect(service.isSelfRegistrationEnabled.value).toBe(true);

    configState.setState({
      ...configState.snapshot(),
      setting: { values: { 'Abp.Account.IsSelfRegistrationEnabled': 'false' } },
    } as ApplicationConfigurationDto);

    expect(service.isSelfRegistrationEnabled.value).toBe(false);
  });

  it('offers no tenant box when multi-tenancy is off', () => {
    const service = createInjector([multiTenancy(false, null)]).get(AuthWrapperService);

    expect(service.isTenantBoxVisible.value).toBe(false);
  });

  it('offers the tenant box when multi-tenancy is on and nothing pinned the tenant', () => {
    const service = createInjector([multiTenancy(true, null)]).get(AuthWrapperService);

    expect(service.isTenantBoxVisible.value).toBe(true);
  });

  it('hides the tenant box once the host name named the tenant', () => {
    const pinned = { id: 't', name: 'acme', isAvailable: true };
    const service = createInjector([multiTenancy(true, pinned)]).get(AuthWrapperService);

    expect(service.isTenantBoxVisible.value).toBe(false);
  });
});
