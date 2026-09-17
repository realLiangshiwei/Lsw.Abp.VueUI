import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { NameValue, RestConfig, ServiceOf } from '@lsw-abpvue/core';

export const TimeZoneSettingsService = defineService('TimeZoneSettingsService', () => {
  const rest = inject(RestService);
  const apiName = 'SettingManagement';

  return {
    apiName,

    get: (config?: RestConfig): Promise<string> =>
      rest.request<never, string>(
        { method: 'GET', responseType: 'text', url: '/api/setting-management/timezone' },
        { apiName, ...config },
      ),

    getTimezones: (config?: RestConfig): Promise<NameValue[]> =>
      rest.request<never, NameValue[]>(
        { method: 'GET', url: '/api/setting-management/timezone/timezones' },
        { apiName, ...config },
      ),

    update: (timezone: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'POST', url: '/api/setting-management/timezone', params: { timezone } },
        { apiName, ...config },
      ),
  };
});
export type TimeZoneSettingsService = ServiceOf<typeof TimeZoneSettingsService>;
