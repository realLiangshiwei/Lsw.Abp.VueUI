import { AccountComponents } from '@lsw-abpvue/account-core';

export const AccountProComponents = {
  ...AccountComponents,
  AuthWrapper: 'Account.AuthWrapper',
  LoginWithRecoveryCodeComponent: 'Account.LoginWithRecoveryCodeComponent',
  EmailConfirmation: 'Account.EmailConfirmationComponent',
  RefreshPassword: 'Account.RefreshPasswordComponent',
  Logo: 'Account.LogoComponent',
  MySecurityLogs: 'Account.MySecurityLogs',
  ProfilePicture: 'Account.ProfilePicture',
  LinkLogged: 'Account.LinkLogged',
  SendSecurityCode: 'Account.SendSecurityCode',
  Sessions: 'Account.Sessions',
  ConfirmUser: 'Account.ConfirmUser',
  Invite: 'Account.InviteComponent',
} as const;
