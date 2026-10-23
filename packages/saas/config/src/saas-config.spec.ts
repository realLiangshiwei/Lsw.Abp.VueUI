import {
  AbpHttpError,
  APP_INITIALIZERS,
  AuthErrorFilterService,
  ConfigStateService,
  createInjector,
  RoutesService,
} from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import { describe, expect, it } from 'vitest';
import {
  provideSaasConfig,
  SaasAuthFilterNames,
  SaasPolicyNames,
  SaasRouteNames,
  SaasSettingTabNames,
} from './index.js';

describe('SaaS configuration', () => {
  it('registers the official route names, ordering and permissions without importing pages', () => {
    const injector = createInjector([provideSaasConfig()]);
    for (const initialize of injector.get(APP_INITIALIZERS, [])) injector.runInContext(initialize);
    const routes = injector.get(RoutesService).flat.value;
    expect(routes.map(route => [route.path, route.name, route.requiredPolicy])).toEqual([
      ['/saas/tenants', SaasRouteNames.Tenants, SaasPolicyNames.Tenants],
      ['/saas/editions', SaasRouteNames.Editions, SaasPolicyNames.Editions],
      ['/saas', SaasRouteNames.Saas, 'Saas.Tenants || Saas.Editions'],
    ]);
    expect(routes.filter(route => route.parentName === SaasRouteNames.Saas)).toHaveLength(2);
    expect(injector.get(RoutesService).visible.value).toEqual([]);
    const config = injector.get(ConfigStateService);
    const state = config.snapshot();
    config.setState({
      ...state,
      auth: { grantedPolicies: { [SaasPolicyNames.SettingManagement]: true } },
    });
    expect(injector.get(SettingTabsService).visible.value.map(tab => tab.name)).toContain(
      SaasSettingTabNames.SaasManagement,
    );
    config.setState({ ...config.snapshot(), currentTenant: { id: 'tenant', isAvailable: true } });
    expect(injector.get(SettingTabsService).visible.value).toEqual([]);
    injector.destroy();
  });

  it('claims only impersonation authentication failures and tolerates an absent error body', () => {
    const injector = createInjector([provideSaasConfig()]);
    for (const initialize of injector.get(APP_INITIALIZERS, [])) injector.runInContext(initialize);
    const filters = injector.get(AuthErrorFilterService);
    expect(filters.get(SaasAuthFilterNames.Impersonation)?.executable).toBe(true);
    const error = (raw?: unknown) =>
      new AbpHttpError({
        status: 400,
        statusText: 'Bad Request',
        method: 'POST',
        url: '/connect/token',
        raw,
      });
    expect(filters.run(error())).toBe(false);
    expect(filters.run(error({ grant_type: 'password' }))).toBe(false);
    expect(filters.run(error({ grant_type: 'Impersonation' }))).toBe(true);
    injector.destroy();
  });
});
