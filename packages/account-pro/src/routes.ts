import { LayoutType } from '@lsw-abpvue/core';
import { authenticationFlowGuard } from '@lsw-abpvue/account';
import { AbpReplaceableRouteContainer, withResolvers } from '@lsw-abpvue/core/router';
import { inject } from '@lsw-abpvue/core';
import type { RouteRecordRaw } from 'vue-router';
import AccountInvitationPage from './components/AccountInvitationPage.vue';
import AccountWorkflowsPage from './components/AccountWorkflowsPage.vue';
import ManageProfilePage from './components/ManageProfilePage.vue';
import MySecurityLogsPage from './components/MySecurityLogsPage.vue';
import AccountSessionsPage from './components/AccountSessionsPage.vue';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SendSecurityCodePage,
  LoginWithRecoveryCodePage,
  RefreshPasswordPage,
  EmailConfirmationPage,
  ConfirmUserPage,
  LinkLoggedPage,
} from './components/auth-pages.js';
import { AccountProComponents } from './enums/components.js';
import { AccountAuthFlowService } from './services/auth-flow.service.js';
import { accountProExtensionsResolver } from './resolvers/extensions.resolver.js';
import { provideAccountPro } from './providers/account-pro.provider.js';
import type { AccountProConfigOptions } from './models/config-options.js';

export function createAccountProRoutes(options?: AccountProConfigOptions): RouteRecordRaw[] {
  const pages = [
    {
      path: 'login',
      key: AccountProComponents.Login,
      component: LoginPage,
      title: 'AbpAccount::Login',
      flowGuard: true,
    },
    {
      path: 'register',
      key: AccountProComponents.Register,
      component: RegisterPage,
      title: 'AbpAccount::Register',
      flowGuard: true,
    },
    {
      path: 'forgot-password',
      key: AccountProComponents.ForgotPassword,
      component: ForgotPasswordPage,
      title: 'AbpAccount::ForgotPassword',
      flowGuard: true,
    },
    {
      path: 'reset-password',
      key: AccountProComponents.ResetPassword,
      component: ResetPasswordPage,
      title: 'AbpAccount::ResetPassword',
    },
    {
      path: 'email-confirmation',
      key: AccountProComponents.EmailConfirmation,
      component: EmailConfirmationPage,
      title: 'AbpAccount::EmailConfirmation',
    },
    {
      path: 'link-logged',
      key: AccountProComponents.LinkLogged,
      component: LinkLoggedPage,
      title: 'AbpAccount::LinkLogged',
      authenticated: true,
    },
    {
      path: 'send-security-code',
      key: AccountProComponents.SendSecurityCode,
      component: SendSecurityCodePage,
      title: 'AbpAccount::TwoFactorVerification',
      challenge: 'two-factor',
    },
    {
      path: 'login-with-recovery-code',
      key: AccountProComponents.LoginWithRecoveryCodeComponent,
      component: LoginWithRecoveryCodePage,
      title: 'AbpAccount::LoginWithRecoveryCode',
      challenge: 'two-factor',
    },
    {
      path: 'change-password',
      key: AccountProComponents.RefreshPassword,
      component: RefreshPasswordPage,
      title: 'AbpAccount::ChangePassword',
      challenge: 'change-password',
    },
    {
      path: 'confirm-user',
      key: AccountProComponents.ConfirmUser,
      component: ConfirmUserPage,
      title: 'AbpAccount::ConfirmUser',
      challenge: 'confirm-user',
    },
    {
      path: 'manage',
      key: AccountProComponents.ManageProfile,
      component: ManageProfilePage,
      title: 'AbpAccount::MyAccount',
      authenticated: true,
    },
    {
      path: 'security-logs',
      key: AccountProComponents.MySecurityLogs,
      component: MySecurityLogsPage,
      title: 'AbpAccount::MySecurityLogs',
      authenticated: true,
    },
    {
      path: 'sessions',
      key: AccountProComponents.Sessions,
      component: AccountSessionsPage,
      title: 'AbpIdentity::Sessions',
      authenticated: true,
    },
  ];
  return [
    { path: '/account', redirect: '/account/login' },
    ...pages.map((page): RouteRecordRaw => ({
      path: `/account/${page.path}`,
      component: AbpReplaceableRouteContainer,
      beforeEnter: [
        withResolvers([accountProExtensionsResolver]),
        ...(page.flowGuard ? [authenticationFlowGuard] : []),
        ...('challenge' in page
          ? [
              () =>
                inject(AccountAuthFlowService).challenge.value?.step === page.challenge
                  ? true
                  : '/account/login',
            ]
          : []),
      ],
      meta: {
        title: page.title,
        localLoginRequired: page.path === 'login',
        accountAuthWrapperKey: AccountProComponents.AuthWrapper,
        accountLogoKey: AccountProComponents.Logo,
        layout: page.authenticated ? LayoutType.application : LayoutType.account,
        requiresAuthentication: page.authenticated ?? false,
        tenantBoxVisible: ['login', 'register', 'forgot-password'].includes(page.path),
        providers: [...provideAccountPro(options).ɵproviders],
        replaceableComponent: { key: page.key, defaultComponent: page.component },
      },
    })),
    {
      path: '/account/workflows',
      component: AccountWorkflowsPage,
      meta: { title: 'AbpAccount::LinkedAccounts', layout: LayoutType.application },
    },
    {
      path: '/account/invite',
      alias: '/account/invitation',
      component: AccountInvitationPage,
      meta: {
        title: 'AbpIdentity::InviteUser',
        localLoginRequired: false,
        accountAuthWrapperKey: AccountProComponents.AuthWrapper,
        accountLogoKey: AccountProComponents.Logo,
        layout: LayoutType.account,
        tenantBoxVisible: false,
      },
    },
  ];
}
