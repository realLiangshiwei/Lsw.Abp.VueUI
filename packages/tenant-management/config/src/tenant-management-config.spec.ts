import {
  APP_INITIALIZERS,
  createInjector,
  RoutesService,
  runInInjectionContext,
  type Injector,
} from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { TenantManagementPolicyNames } from './enums/policy-names.js';
import { TenantManagementRouteNames } from './enums/route-names.js';
import { provideTenantManagementConfig } from './providers/tenant-management-config.provider.js';

/** What `createAbpApp` does at startup. */
function start(): Injector {
  const injector = createInjector([provideTenantManagementConfig()]);

  for (const initializer of injector.get(APP_INITIALIZERS, [], { optional: true })) {
    runInInjectionContext(injector, initializer);
  }

  return injector;
}

describe('provideTenantManagementConfig', () => {
  // The tree drops an item whose parent is not registered, and `theme-shared` is what
  // registers administration, so the flat list is what this suite reads.
  const registered = (injector: Injector, name: string) =>
    injector.get(RoutesService).flat.value.find(route => route.name === name);

  it('files the module under administration, with the list under it', () => {
    const injector = start();

    // The flat list is sorted by order across the whole tree, so this is a set.
    expect(
      injector
        .get(RoutesService)
        .flat.value.map(route => route.name)
        .sort(),
    ).toEqual(
      [TenantManagementRouteNames.TenantManagement, TenantManagementRouteNames.Tenants].sort(),
    );

    expect(registered(injector, TenantManagementRouteNames.Tenants)?.parentName).toBe(
      TenantManagementRouteNames.TenantManagement,
    );

    expect(registered(injector, TenantManagementRouteNames.TenantManagement)?.parentName).toBe(
      'AbpUiNavigation::Menu:Administration',
    );
    expect(registered(injector, TenantManagementRouteNames.Tenants)?.path).toBe(
      '/tenant-management/tenants',
    );
  });

  it('shows the branch to whoever may see the list', () => {
    expect(registered(start(), TenantManagementRouteNames.TenantManagement)?.requiredPolicy).toBe(
      TenantManagementPolicyNames.TenantManagement,
    );
  });

  it('is invisible until the policy is granted', () => {
    expect(start().get(RoutesService).visible.value).toEqual([]);
  });
});
