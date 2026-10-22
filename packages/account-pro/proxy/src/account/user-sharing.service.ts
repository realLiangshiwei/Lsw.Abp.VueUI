import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { ListResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  AcceptInvitationInput,
  InvitationInfoDto,
  LeaveTenantInput,
  RejectInvitationInput,
  UserSharingDto,
} from './models.js';

export const UserSharingService = defineService('UserSharingService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccountPublic';

  return {
    apiName,

    acceptInvitation: (input: AcceptInvitationInput, config?: RestConfig): Promise<void> =>
      rest.request<AcceptInvitationInput, void>(
        { method: 'POST', url: '/api/account/user-sharing/invitation/accept', body: input },
        { apiName, ...config },
      ),

    getAllList: (config?: RestConfig): Promise<ListResultDto<UserSharingDto>> =>
      rest.request<never, ListResultDto<UserSharingDto>>(
        { method: 'GET', url: '/api/account/user-sharing' },
        { apiName, ...config },
      ),

    getInvitationByToken: (token: string, config?: RestConfig): Promise<InvitationInfoDto> =>
      rest.request<never, InvitationInfoDto>(
        { method: 'GET', url: '/api/account/user-sharing/invitation', params: { token } },
        { apiName, ...config },
      ),

    leave: (input: LeaveTenantInput, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'DELETE',
          url: '/api/account/user-sharing/leave',
          params: { tenantId: input.tenantId },
        },
        { apiName, ...config },
      ),

    rejectInvitation: (input: RejectInvitationInput, config?: RestConfig): Promise<void> =>
      rest.request<RejectInvitationInput, void>(
        { method: 'POST', url: '/api/account/user-sharing/invitation/reject', body: input },
        { apiName, ...config },
      ),
  };
});
export type UserSharingService = ServiceOf<typeof UserSharingService>;
