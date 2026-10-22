import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { AuditLogGlobalSettingsDto, AuditLogSettingsDto } from './models.js';

export const AuditLogSettingsService = defineService('AuditLogSettingsService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAuditLogging';

  return {
    apiName,

    get: (config?: RestConfig): Promise<AuditLogSettingsDto> =>
      rest.request<never, AuditLogSettingsDto>(
        { method: 'GET', url: '/api/audit-logging/settings' },
        { apiName, ...config },
      ),

    getGlobal: (config?: RestConfig): Promise<AuditLogGlobalSettingsDto> =>
      rest.request<never, AuditLogGlobalSettingsDto>(
        { method: 'GET', url: '/api/audit-logging/settings/global' },
        { apiName, ...config },
      ),

    update: (input: AuditLogSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<AuditLogSettingsDto, void>(
        { method: 'PUT', url: '/api/audit-logging/settings', body: input },
        { apiName, ...config },
      ),

    updateGlobal: (input: AuditLogGlobalSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<AuditLogGlobalSettingsDto, void>(
        { method: 'PUT', url: '/api/audit-logging/settings/global', body: input },
        { apiName, ...config },
      ),
  };
});
export type AuditLogSettingsService = ServiceOf<typeof AuditLogSettingsService>;
