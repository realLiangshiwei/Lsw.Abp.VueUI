import { APP_INITIALIZERS, createInjector, RoutesService } from '@lsw-abpvue/core';
import { expect, it } from 'vitest';
import { provideIdentityProConfig, provideIdentityConfig } from './index.js';

it('registers the shared identity menu once when configured through the commercial entry', () => {
  const injector = createInjector([provideIdentityProConfig()]);
  for (const initializer of injector.get(APP_INITIALIZERS, [])) {
    injector.runInContext(initializer);
  }
  expect(provideIdentityProConfig).toBe(provideIdentityConfig);
  expect(injector.get(RoutesService).flat.value.map(route => route.name)).toEqual([
    'AbpIdentity::OrganizationUnits',
    'AbpIdentity::Menu:IdentityManagement',
    'AbpIdentity::Roles',
    'AbpIdentity::Users',
    'AbpIdentity::ClaimTypes',
    'AbpIdentity::SecurityLogs',
  ]);
  injector.destroy();
});
