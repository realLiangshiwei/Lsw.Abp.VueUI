import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { EmailSettingsDto, SendTestEmailInput, UpdateEmailSettingsDto } from './models.js';

export const EmailSettingsService = defineService('EmailSettingsService', () => {
  const rest = inject(RestService);
  const apiName = 'SettingManagement';

  return {
    apiName,

    get: (config?: RestConfig): Promise<EmailSettingsDto> =>
      rest.request<never, EmailSettingsDto>(
        { method: 'GET', url: '/api/setting-management/emailing' },
        { apiName, ...config },
      ),

    sendTestEmail: (input: SendTestEmailInput, config?: RestConfig): Promise<void> =>
      rest.request<SendTestEmailInput, void>(
        { method: 'POST', url: '/api/setting-management/emailing/send-test-email', body: input },
        { apiName, ...config },
      ),

    update: (input: UpdateEmailSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<UpdateEmailSettingsDto, void>(
        { method: 'POST', url: '/api/setting-management/emailing', body: input },
        { apiName, ...config },
      ),
  };
});
export type EmailSettingsService = ServiceOf<typeof EmailSettingsService>;
