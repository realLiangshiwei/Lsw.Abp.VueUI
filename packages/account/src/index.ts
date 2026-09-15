export { default as ForgotPasswordPage } from './components/ForgotPasswordPage.vue';
export { default as LoginPage } from './components/LoginPage.vue';
export { default as RegisterPage } from './components/RegisterPage.vue';
export { default as ResetPasswordPage } from './components/ResetPasswordPage.vue';

export { authenticationFlowGuard } from './guards/authentication-flow.guard.js';

export type { AccountConfigOptions, AccountFormPropContributors } from './models/config-options.js';

export { provideAccount } from './providers/account.provider.js';

export { createAccountRoutes } from './routes.js';

export {
  ACCOUNT_APP_NAME,
  ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS,
  ACCOUNT_RE_LOGIN_CONFIRMATION,
  ACCOUNT_REDIRECT_URL,
} from './tokens/config-options.token.js';

export { redirectUrlOf } from './utils/redirect-url.js';
