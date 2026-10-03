export { default as ChangePasswordTab } from './components/ChangePasswordTab.vue';
export { default as ForgotPasswordPage } from './components/ForgotPasswordPage.vue';
export { default as LoginPage } from './components/LoginPage.vue';
export { default as ManageProfilePage } from './components/ManageProfilePage.vue';
export { default as PersonalSettingsTab } from './components/PersonalSettingsTab.vue';
export { default as RegisterPage } from './components/RegisterPage.vue';
export { default as ResetPasswordPage } from './components/ResetPasswordPage.vue';

export { DEFAULT_PERSONAL_SETTINGS_FORM_PROPS } from './defaults/personal-settings.js';

export { ManageProfileTabs } from './enums/manage-profile-tabs.js';
export type { ManageProfileTab } from './enums/manage-profile-tabs.js';

export { authenticationFlowGuard } from './guards/authentication-flow.guard.js';

export type { AccountConfigOptions, AccountFormPropContributors } from './models/config-options.js';

export { provideAccount } from './providers/account.provider.js';
export { provideManageProfileTabs } from './providers/manage-profile-tabs.provider.js';

export { accountExtensionsResolver } from './resolvers/extensions.resolver.js';
export {
  TwoFactorService,
  TwoFactorDeliveryUnavailableError,
} from './services/two-factor.service.js';
export type { TwoFactorProvider } from './services/two-factor.service.js';

export { createAccountRoutes } from './routes.js';

export {
  ACCOUNT_APP_NAME,
  ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS,
  ACCOUNT_RE_LOGIN_CONFIRMATION,
  ACCOUNT_REDIRECT_URL,
} from './tokens/config-options.token.js';

export { redirectUrlOf } from './utils/redirect-url.js';
