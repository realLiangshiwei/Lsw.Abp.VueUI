import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { ListResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  DelegateNewUserInput,
  GetUserLookupInput,
  UserDelegationDto,
  UserLookupDto,
} from './models.js';

export const IdentityUserDelegationService = defineService('IdentityUserDelegationService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccountPublic';

  return {
    apiName,

    delegateNewUser: (input: DelegateNewUserInput, config?: RestConfig): Promise<void> =>
      rest.request<DelegateNewUserInput, void>(
        { method: 'POST', url: '/api/account/user-delegation/delegate-new-user', body: input },
        { apiName, ...config },
      ),

    deleteDelegation: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'POST', url: '/api/account/user-delegation/delete-delegation', params: { id } },
        { apiName, ...config },
      ),

    getActiveDelegations: (config?: RestConfig): Promise<ListResultDto<UserDelegationDto>> =>
      rest.request<never, ListResultDto<UserDelegationDto>>(
        { method: 'GET', url: '/api/account/user-delegation/active-delegations' },
        { apiName, ...config },
      ),

    getDelegatedUsers: (config?: RestConfig): Promise<ListResultDto<UserDelegationDto>> =>
      rest.request<never, ListResultDto<UserDelegationDto>>(
        { method: 'GET', url: '/api/account/user-delegation/delegated-users' },
        { apiName, ...config },
      ),

    getMyDelegatedUsers: (config?: RestConfig): Promise<ListResultDto<UserDelegationDto>> =>
      rest.request<never, ListResultDto<UserDelegationDto>>(
        { method: 'GET', url: '/api/account/user-delegation/my-delegated-users' },
        { apiName, ...config },
      ),

    getUserLookup: (
      input: GetUserLookupInput,
      config?: RestConfig,
    ): Promise<ListResultDto<UserLookupDto>> =>
      rest.request<never, ListResultDto<UserLookupDto>>(
        {
          method: 'GET',
          url: '/api/account/user-delegation/user-lookup',
          params: { userName: input.userName },
        },
        { apiName, ...config },
      ),
  };
});
export type IdentityUserDelegationService = ServiceOf<typeof IdentityUserDelegationService>;
