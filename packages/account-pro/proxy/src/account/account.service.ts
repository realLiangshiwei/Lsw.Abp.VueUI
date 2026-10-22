import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  GetIdentitySecurityLogListInput,
  IdentitySecurityLogDto,
  IdentityUserDto,
} from '../identity/models.js';
import type {
  AuthenticatorInfoDto,
  ChangeEmailInput,
  CheckEmailConfirmationCodeDto,
  ConfirmEmailInput,
  ConfirmPhoneNumberInput,
  EmailConfirmationCodeLimitDto,
  EmailLoginCodeLimitDto,
  GetTwoFactorProvidersInput,
  IdentityUserConfirmationStateDto,
  ProfilePictureSourceDto,
  RegisterDto,
  ResetPasswordDto,
  SendEmailConfirmationCodeDto,
  SendEmailConfirmationTokenDto,
  SendEmailLoginCodeDto,
  SendEmailLoginCodeResultDto,
  SendPasswordResetCodeDto,
  SendPhoneNumberConfirmationTokenDto,
  SendTwoFactorCodeInput,
  VerifyAuthenticatorCodeDto,
  VerifyAuthenticatorCodeInput,
  VerifyChangeEmailTokenInput,
  VerifyEmailConfirmationTokenInput,
  VerifyEmailLoginCodeDto,
  VerifyEmailLoginCodeResultDto,
  VerifyEmailLoginLinkTokenDto,
  VerifyEmailLoginLinkTokenResultDto,
  VerifyPasswordResetTokenInput,
} from './models.js';

export const AccountService = defineService('AccountService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccountPublic';

  return {
    apiName,

    changeEmail: (input: ChangeEmailInput, config?: RestConfig): Promise<void> =>
      rest.request<ChangeEmailInput, void>(
        { method: 'POST', url: '/api/account/change-email', body: input },
        { apiName, ...config },
      ),

    checkEmailConfirmationCode: (
      input: CheckEmailConfirmationCodeDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<CheckEmailConfirmationCodeDto, void>(
        { method: 'POST', url: '/api/account/check-email-confirmation-code', body: input },
        { apiName, ...config },
      ),

    confirmEmail: (input: ConfirmEmailInput, config?: RestConfig): Promise<void> =>
      rest.request<ConfirmEmailInput, void>(
        { method: 'POST', url: '/api/account/confirm-email', body: input },
        { apiName, ...config },
      ),

    confirmPhoneNumber: (input: ConfirmPhoneNumberInput, config?: RestConfig): Promise<void> =>
      rest.request<ConfirmPhoneNumberInput, void>(
        { method: 'POST', url: '/api/account/confirm-phone-number', body: input },
        { apiName, ...config },
      ),

    getAuthenticatorInfo: (config?: RestConfig): Promise<AuthenticatorInfoDto> =>
      rest.request<never, AuthenticatorInfoDto>(
        { method: 'GET', url: '/api/account/authenticator-info' },
        { apiName, ...config },
      ),

    getConfirmationState: (
      id: string,
      config?: RestConfig,
    ): Promise<IdentityUserConfirmationStateDto> =>
      rest.request<never, IdentityUserConfirmationStateDto>(
        { method: 'GET', url: '/api/account/confirmation-state', params: { id } },
        { apiName, ...config },
      ),

    getEmailConfirmationCodeLimit: (
      emailAddress: string,
      config?: RestConfig,
    ): Promise<EmailConfirmationCodeLimitDto> =>
      rest.request<never, EmailConfirmationCodeLimitDto>(
        {
          method: 'GET',
          url: '/api/account/email-confirmation-code-limit',
          params: { emailAddress },
        },
        { apiName, ...config },
      ),

    getEmailLoginCodeLimit: (
      emailAddress: string,
      config?: RestConfig,
    ): Promise<EmailLoginCodeLimitDto> =>
      rest.request<never, EmailLoginCodeLimitDto>(
        { method: 'GET', url: '/api/account/email-login-code-limit', params: { emailAddress } },
        { apiName, ...config },
      ),

    getProfilePicture: (id: string, config?: RestConfig): Promise<ProfilePictureSourceDto> =>
      rest.request<never, ProfilePictureSourceDto>(
        { method: 'GET', url: `/api/account/profile-picture/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getProfilePictureFile: (id: string, config?: RestConfig): Promise<Blob> =>
      rest.request<never, Blob>(
        {
          method: 'GET',
          responseType: 'blob',
          url: `/api/account/profile-picture-file/${encodeURIComponent(String(id))}`,
        },
        { apiName, ...config },
      ),

    getSecurityLogList: (
      input: GetIdentitySecurityLogListInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentitySecurityLogDto>> =>
      rest.request<never, PagedResultDto<IdentitySecurityLogDto>>(
        {
          method: 'GET',
          url: '/api/account/security-logs',
          params: {
            startTime: input.startTime,
            endTime: input.endTime,
            applicationName: input.applicationName,
            identity: input.identity,
            action: input.action,
            userName: input.userName,
            clientId: input.clientId,
            correlationId: input.correlationId,
            clientIpAddress: input.clientIpAddress,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
            extraProperties: input.extraProperties,
          },
        },
        { apiName, ...config },
      ),

    getTwoFactorProviders: (
      input: GetTwoFactorProvidersInput,
      config?: RestConfig,
    ): Promise<string[]> =>
      rest.request<never, string[]>(
        {
          method: 'GET',
          url: '/api/account/two-factor-providers',
          params: { userId: input.userId, token: input.token },
        },
        { apiName, ...config },
      ),

    hasAuthenticator: (config?: RestConfig): Promise<boolean> =>
      rest.request<never, boolean>(
        { method: 'GET', url: '/api/account/has-authenticator-key' },
        { apiName, ...config },
      ),

    recaptchaByCaptchaResponse: (captchaResponse: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'GET', url: '/api/account/recaptcha-validate', params: { captchaResponse } },
        { apiName, ...config },
      ),

    register: (input: RegisterDto, config?: RestConfig): Promise<IdentityUserDto> =>
      rest.request<RegisterDto, IdentityUserDto>(
        { method: 'POST', url: '/api/account/register', body: input },
        { apiName, ...config },
      ),

    resetAuthenticator: (config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'POST', url: '/api/account/reset-authenticator' },
        { apiName, ...config },
      ),

    resetPassword: (input: ResetPasswordDto, config?: RestConfig): Promise<void> =>
      rest.request<ResetPasswordDto, void>(
        { method: 'POST', url: '/api/account/reset-password', body: input },
        { apiName, ...config },
      ),

    sendEmailConfirmationCode: (
      input: SendEmailConfirmationCodeDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<SendEmailConfirmationCodeDto, void>(
        { method: 'POST', url: '/api/account/send-email-confirmation-code', body: input },
        { apiName, ...config },
      ),

    sendEmailConfirmationToken: (
      input: SendEmailConfirmationTokenDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<SendEmailConfirmationTokenDto, void>(
        { method: 'POST', url: '/api/account/send-email-confirmation-token', body: input },
        { apiName, ...config },
      ),

    sendEmailLoginCode: (
      input: SendEmailLoginCodeDto,
      config?: RestConfig,
    ): Promise<SendEmailLoginCodeResultDto> =>
      rest.request<SendEmailLoginCodeDto, SendEmailLoginCodeResultDto>(
        { method: 'POST', url: '/api/account/send-email-login-code', body: input },
        { apiName, ...config },
      ),

    sendPasswordResetCode: (input: SendPasswordResetCodeDto, config?: RestConfig): Promise<void> =>
      rest.request<SendPasswordResetCodeDto, void>(
        { method: 'POST', url: '/api/account/send-password-reset-code', body: input },
        { apiName, ...config },
      ),

    sendPhoneNumberConfirmationToken: (
      input: SendPhoneNumberConfirmationTokenDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<SendPhoneNumberConfirmationTokenDto, void>(
        { method: 'POST', url: '/api/account/send-phone-number-confirmation-token', body: input },
        { apiName, ...config },
      ),

    sendTwoFactorCode: (input: SendTwoFactorCodeInput, config?: RestConfig): Promise<void> =>
      rest.request<SendTwoFactorCodeInput, void>(
        { method: 'POST', url: '/api/account/send-two-factor-code', body: input },
        { apiName, ...config },
      ),

    setProfilePicture: (input: FormData, config?: RestConfig): Promise<void> =>
      rest.request<FormData, void>(
        {
          method: 'POST',
          url: '/api/account/profile-picture',
          params: { type: input.get('Type') ?? input.get('type') },
          body: input,
        },
        { apiName, ...config },
      ),

    verifyAuthenticatorCode: (
      input: VerifyAuthenticatorCodeInput,
      config?: RestConfig,
    ): Promise<VerifyAuthenticatorCodeDto> =>
      rest.request<VerifyAuthenticatorCodeInput, VerifyAuthenticatorCodeDto>(
        { method: 'POST', url: '/api/account/verify-authenticator-code', body: input },
        { apiName, ...config },
      ),

    verifyChangeEmailToken: (
      input: VerifyChangeEmailTokenInput,
      config?: RestConfig,
    ): Promise<boolean> =>
      rest.request<VerifyChangeEmailTokenInput, boolean>(
        { method: 'POST', url: '/api/account/verify-change-email-token', body: input },
        { apiName, ...config },
      ),

    verifyEmailConfirmationToken: (
      input: VerifyEmailConfirmationTokenInput,
      config?: RestConfig,
    ): Promise<boolean> =>
      rest.request<VerifyEmailConfirmationTokenInput, boolean>(
        { method: 'POST', url: '/api/account/verify-email-confirmation-token', body: input },
        { apiName, ...config },
      ),

    verifyEmailLoginCode: (
      input: VerifyEmailLoginCodeDto,
      config?: RestConfig,
    ): Promise<VerifyEmailLoginCodeResultDto> =>
      rest.request<VerifyEmailLoginCodeDto, VerifyEmailLoginCodeResultDto>(
        { method: 'POST', url: '/api/account/verify-email-login-code', body: input },
        { apiName, ...config },
      ),

    verifyEmailLoginLinkToken: (
      input: VerifyEmailLoginLinkTokenDto,
      config?: RestConfig,
    ): Promise<VerifyEmailLoginLinkTokenResultDto> =>
      rest.request<VerifyEmailLoginLinkTokenDto, VerifyEmailLoginLinkTokenResultDto>(
        { method: 'POST', url: '/api/account/verify-email-login-link-token', body: input },
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
