import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { IdentityUserDto } from '../identity/models.js';
import type {
  RegisterDto,
  ResetPasswordDto,
  SendPasswordResetCodeDto,
  VerifyPasswordResetTokenInput,
} from './models.js';

export const AccountService = defineService('AccountService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccount';

  return {
    apiName,

    register: (input: RegisterDto, config?: RestConfig): Promise<IdentityUserDto> =>
      rest.request<RegisterDto, IdentityUserDto>(
        { method: 'POST', url: '/api/account/register', body: input },
        { apiName, ...config },
      ),

    resetPassword: (input: ResetPasswordDto, config?: RestConfig): Promise<void> =>
      rest.request<ResetPasswordDto, void>(
        { method: 'POST', url: '/api/account/reset-password', body: input },
        { apiName, ...config },
      ),

    sendPasswordResetCode: (input: SendPasswordResetCodeDto, config?: RestConfig): Promise<void> =>
      rest.request<SendPasswordResetCodeDto, void>(
        { method: 'POST', url: '/api/account/send-password-reset-code', body: input },
        { apiName, ...config },
      ),

    verifyPasswordResetToken: (
      input: VerifyPasswordResetTokenInput,
      config?: RestConfig,
    ): Promise<boolean> =>
      rest.request<VerifyPasswordResetTokenInput, boolean>(
        { method: 'POST', url: '/api/account/verify-password-reset-token', body: input },
        { apiName, ...config },
      ),
  };
});
export type AccountService = ServiceOf<typeof AccountService>;
