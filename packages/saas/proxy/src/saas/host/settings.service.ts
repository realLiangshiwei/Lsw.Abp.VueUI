import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { SaasHostSettingDto } from './dtos/models.js';

export const SettingsService = defineService('SettingsService', () => {
  const rest = inject(RestService);
  const apiName = 'SaasHost';

  return {
    apiName,

    get: (config?: RestConfig): Promise<SaasHostSettingDto> =>
      rest.request<never, SaasHostSettingDto>(
        { method: 'GET', url: '/api/saas/settings' },
        { apiName, ...config },
      ),

    update: (input: SaasHostSettingDto, config?: RestConfig): Promise<void> =>
      rest.request<SaasHostSettingDto, void>(
        { method: 'PUT', url: '/api/saas/settings', body: input },
        { apiName, ...config },
      ),
  };
});
export type SettingsService = ServiceOf<typeof SettingsService>;
