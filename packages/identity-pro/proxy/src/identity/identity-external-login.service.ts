import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';

export const IdentityExternalLoginService = defineService('IdentityExternalLoginService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    createOrUpdate: (config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'POST', url: '/api/identity/external-login' },
        { apiName, ...config },
      ),
  };
});
export type IdentityExternalLoginService = ServiceOf<typeof IdentityExternalLoginService>;
