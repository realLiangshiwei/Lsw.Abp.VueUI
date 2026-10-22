import { expect, it, vi } from 'vitest';
import { createInjector } from '../di/injector.js';
import { RestService } from '../services/rest.service.js';
import { AbpTenantService } from './pages/abp/multi-tenancy/abp-tenant.service.js';

it('encodes tenant lookup values as a single path segment', async () => {
  const request = vi.fn().mockResolvedValue({ success: false, isActive: false });
  const injector = createInjector([{ provide: RestService, useValue: { request } }]);
  await injector.get(AbpTenantService).findTenantByName('a/b?#');
  expect(request).toHaveBeenCalledWith(
    { method: 'GET', url: '/api/abp/multi-tenancy/tenants/by-name/a%2Fb%3F%23' },
    { apiName: 'abp' },
  );
  injector.destroy();
});
