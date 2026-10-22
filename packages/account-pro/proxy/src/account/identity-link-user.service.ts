import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { ListResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  GenerateLinkUserTokenInput,
  IsLinkedInput,
  LinkUserDto,
  LinkUserInput,
  UnLinkUserInput,
  VerifyLinkLoginTokenInput,
  VerifyLinkTokenInput,
} from './models.js';

export const IdentityLinkUserService = defineService('IdentityLinkUserService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccountPublic';

  return {
    apiName,

    generateLinkLoginToken: (config?: RestConfig): Promise<string> =>
      rest.request<never, string>(
        {
          method: 'POST',
          responseType: 'text',
          url: '/api/account/link-user/generate-link-login-token',
        },
        { apiName, ...config },
      ),

    generateLinkToken: (input: GenerateLinkUserTokenInput, config?: RestConfig): Promise<string> =>
      rest.request<GenerateLinkUserTokenInput, string>(
        {
          method: 'POST',
          responseType: 'text',
          url: '/api/account/link-user/generate-link-token',
          body: input,
        },
        { apiName, ...config },
      ),

    getAllList: (config?: RestConfig): Promise<ListResultDto<LinkUserDto>> =>
      rest.request<never, ListResultDto<LinkUserDto>>(
        { method: 'GET', url: '/api/account/link-user' },
        { apiName, ...config },
      ),

    isLinked: (input: IsLinkedInput, config?: RestConfig): Promise<boolean> =>
      rest.request<IsLinkedInput, boolean>(
        { method: 'POST', url: '/api/account/link-user/is-linked', body: input },
        { apiName, ...config },
      ),

    link: (input: LinkUserInput, config?: RestConfig): Promise<void> =>
      rest.request<LinkUserInput, void>(
        { method: 'POST', url: '/api/account/link-user/link', body: input },
        { apiName, ...config },
      ),

    unlink: (input: UnLinkUserInput, config?: RestConfig): Promise<void> =>
      rest.request<UnLinkUserInput, void>(
        { method: 'POST', url: '/api/account/link-user/unlink', body: input },
        { apiName, ...config },
      ),

    verifyLinkLoginToken: (
      input: VerifyLinkLoginTokenInput,
      config?: RestConfig,
    ): Promise<boolean> =>
      rest.request<VerifyLinkLoginTokenInput, boolean>(
        { method: 'POST', url: '/api/account/link-user/verify-link-login-token', body: input },
        { apiName, ...config },
      ),

    verifyLinkToken: (input: VerifyLinkTokenInput, config?: RestConfig): Promise<boolean> =>
      rest.request<VerifyLinkTokenInput, boolean>(
        { method: 'POST', url: '/api/account/link-user/verify-link-token', body: input },
        { apiName, ...config },
      ),
  };
});
export type IdentityLinkUserService = ServiceOf<typeof IdentityLinkUserService>;
