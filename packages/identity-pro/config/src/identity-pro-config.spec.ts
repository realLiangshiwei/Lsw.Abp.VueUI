import { APP_INITIALIZERS, createInjector, RoutesService } from '@lsw-abpvue/core';
import { provideIdentityConfig as provideBaseConfig } from '@lsw-abpvue/identity/config';
import { describe, expect, it } from 'vitest';
import { IdentityProPolicyNames } from './enums/policy-names.js';
import { IdentityProRouteNames } from './enums/route-names.js';
import { provideIdentityProConfig } from './providers/identity-pro-config.provider.js';

function start(includeBase = false) {
  const injector = createInjector([
    ...(includeBase ? [provideBaseConfig()] : []),
    provideIdentityProConfig(),
  ]);
  for (const initialize of injector.get(APP_INITIALIZERS, [], { optional: true })) {
    injector.runInContext(initialize);
  }
  return injector;
}

describe('commercial identity menus', () => {
  it('registers the implemented pages with exact commercial names and permissions', () => {
    const injector = start();
    const routes = injector.get(RoutesService).flat.value;
    expect(routes.map(route => route.name)).toEqual([
      IdentityProRouteNames.OrganizationUnits,
      IdentityProRouteNames.IdentityManagement,
      IdentityProRouteNames.Roles,
      IdentityProRouteNames.Users,
      IdentityProRouteNames.ClaimTypes,
      IdentityProRouteNames.SecurityLogs,
    ]);
    expect(routes.find(route => route.name === IdentityProRouteNames.ClaimTypes)).toMatchObject({
      path: '/identity/claim-types',
      requiredPolicy: IdentityProPolicyNames.ClaimTypes,
      parentName: IdentityProRouteNames.IdentityManagement,
    });
    expect(
      routes.find(route => route.name === IdentityProRouteNames.IdentityManagement)?.requiredPolicy,
    ).toBe(IdentityProPolicyNames.IdentityManagement);
    injector.destroy();
  });

  it('updates common menu entries instead of registering duplicate base pages', () => {
    const injector = start(true);
    const routes = injector.get(RoutesService).flat.value;
    expect(routes.filter(route => route.path === '/identity/roles')).toHaveLength(1);
    expect(routes.filter(route => route.path === '/identity/users')).toHaveLength(1);
    expect(routes.filter(route => route.path === '/identity/claim-types')).toHaveLength(1);
    injector.destroy();
  });
});
