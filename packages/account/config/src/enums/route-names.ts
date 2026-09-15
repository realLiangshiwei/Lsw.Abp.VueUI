/** The route names ABP's Angular account module uses, verbatim. */
export const AccountRouteNames = {
  Account: 'AbpAccount::Menu:Account',
  Login: 'AbpAccount::Login',
  Register: 'AbpAccount::Register',
  ManageProfile: 'AbpAccount::MyAccount',
  ForgotPassword: 'AbpAccount::ForgotPassword',
  ResetPassword: 'AbpAccount::ResetPassword',
} as const;

export type AccountRouteName = (typeof AccountRouteNames)[keyof typeof AccountRouteNames];
