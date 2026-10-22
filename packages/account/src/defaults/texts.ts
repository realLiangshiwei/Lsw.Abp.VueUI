export const AUTHENTICATOR_CODE = 'AbpAccount::Code';

export const TWO_FACTOR_TEXTS = {
  provider: 'AbpAccount::SelectedProvider',
  code: 'AbpAccount::Code',
  send: 'AbpUi::Submit',
  resend: 'AbpAccount::ReSendCode',
  sent: 'AbpAccount::VerifySecurityCode_Information',
  back: 'AbpAccount::BackToLogin',
  required: 'AbpValidation::ThisFieldIsRequired.',
  unavailable: 'AbpAccount::Volo.Account:UnsupportedTwoFactorProvider',
} as const;
