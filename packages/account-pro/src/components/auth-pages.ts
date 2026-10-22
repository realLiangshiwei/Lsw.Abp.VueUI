import { defineComponent, h, type Component } from 'vue';
import AccountAuthPage from './AccountAuthPage.vue';
import AccountConfirmationPage from './AccountConfirmationPage.vue';

function page(component: Component, mode: string) {
  return defineComponent({ name: `AccountPro${mode}`, setup: () => () => h(component, { mode }) });
}
export const LoginPage = page(AccountAuthPage, 'login');
export const RegisterPage = page(AccountAuthPage, 'register');
export const ForgotPasswordPage = page(AccountAuthPage, 'forgot-password');
export const ResetPasswordPage = page(AccountAuthPage, 'reset-password');
export const SendSecurityCodePage = page(AccountAuthPage, 'two-factor');
export const LoginWithRecoveryCodePage = page(AccountAuthPage, 'recovery-code');
export const RefreshPasswordPage = page(AccountAuthPage, 'change-password');
export const EmailConfirmationPage = page(AccountConfirmationPage, 'email-confirmation');
export const ConfirmUserPage = page(AccountConfirmationPage, 'confirm-user');
export const LinkLoggedPage = page(AccountConfirmationPage, 'link-logged');
