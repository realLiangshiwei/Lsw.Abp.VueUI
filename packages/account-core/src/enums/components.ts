/**
 * The component keys ABP's Angular account module uses, verbatim. They are here rather
 * than in `@lsw-abpvue/account` because the theme renders two of them -- the wrapper the
 * account pages sit in and the tenant box above it -- and a theme never depends on a
 * business module.
 */
export const AccountComponents = {
  Login: 'Account.LoginComponent',
  Register: 'Account.RegisterComponent',
  ForgotPassword: 'Account.ForgotPasswordComponent',
  ResetPassword: 'Account.ResetPasswordComponent',
  ManageProfile: 'Account.ManageProfileComponent',
  TenantBox: 'Account.TenantBoxComponent',
  AuthWrapper: 'Account.AuthWrapperComponent',
  ChangePassword: 'Account.ChangePasswordComponent',
  PersonalSettings: 'Account.PersonalSettingsComponent',
} as const;

export type AccountComponent = (typeof AccountComponents)[keyof typeof AccountComponents];
