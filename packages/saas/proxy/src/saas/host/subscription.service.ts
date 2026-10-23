import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { PaymentRequestWithDetailsDto } from '../../payment/requests/models.js';

export const SubscriptionService = defineService('SubscriptionService', () => {
  const rest = inject(RestService);
  const apiName = 'SaasHost';

  return {
    apiName,

    createSubscription: (
      editionId: string,
      tenantId: string,
      config?: RestConfig,
    ): Promise<PaymentRequestWithDetailsDto> =>
      rest.request<never, PaymentRequestWithDetailsDto>(
        { method: 'POST', url: '/api/saas/subscription', params: { editionId, tenantId } },
        { apiName, ...config },
      ),
  };
});
export type SubscriptionService = ServiceOf<typeof SubscriptionService>;
