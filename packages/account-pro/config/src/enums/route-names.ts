import { AccountRouteNames } from '@lsw-abpvue/account/config';

export const AccountProRouteNames = {
  ...AccountRouteNames,
  LoginWithRecoveryCode: 'AbpAccount::LoginWithRecoveryCode',
  EmailConfirmation: 'AbpAccount::EmailConfirmation',
  LinkLogged: 'AbpAccount::LinkLogged',
  SendSecurityCode: 'AbpAccount::TwoFactorVerification',
  MySecurityLogs: 'AbpAccount::MySecurityLogs',
  Sessions: 'AbpIdentity::Sessions',
  ConfirmUser: 'AbpAccount::ConfirmUser',
  Invite: 'AbpIdentity::InviteUser',
} as const;

export type AccountProRouteName = (typeof AccountProRouteNames)[keyof typeof AccountProRouteNames];
