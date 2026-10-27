import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@lsw-abpvue/theme-basic/style.css';
// abpv:begin gdpr
import '@lsw-abpvue/gdpr/style.css';
// abpv:end gdpr
import {
  createAbpApp,
  loadRuntimeConfig,
  provideAbpCore,
  provideAppInitErrorHandler,
  withOptions,
} from '@lsw-abpvue/core';
import { provideAbpRouter } from '@lsw-abpvue/core/router';
import { provideAbpOAuth } from '@lsw-abpvue/oauth';
import { provideAbpThemeBasic } from '@lsw-abpvue/theme-basic';
// abpv:begin account
import { provideManageProfileTabs } from '@lsw-abpvue/account';
import { provideAccountConfig } from '@lsw-abpvue/account/config';
// abpv:end account
// abpv:begin identity
import { provideIdentityConfig } from '@lsw-abpvue/identity/config';
// abpv:end identity
// abpv:begin tenant-management
import { provideTenantManagementConfig } from '@lsw-abpvue/tenant-management/config';
// abpv:end tenant-management
// abpv:begin setting-management
import { provideSettingManagementConfig } from '@lsw-abpvue/setting-management/config';
// abpv:end setting-management
// abpv:begin feature-management
import { provideFeatureManagementConfig } from '@lsw-abpvue/feature-management/config';
// abpv:end feature-management
// abpv:begin account-pro
import { provideAccountProConfig } from '@lsw-abpvue/account-pro/config';
// abpv:end account-pro
// abpv:begin account-pro-admin
import { provideAccountProAdminConfig } from '@lsw-abpvue/account-pro/admin/config';
// abpv:end account-pro-admin
// abpv:begin identity-pro
import { provideIdentityProConfig } from '@lsw-abpvue/identity-pro/config';
// abpv:end identity-pro
// abpv:begin saas
import { provideSaasConfig } from '@lsw-abpvue/saas/config';
// abpv:end saas
// abpv:begin audit-logging
import { provideAuditLoggingConfig } from '@lsw-abpvue/audit-logging/config';
// abpv:end audit-logging
// abpv:begin language-management
import { provideLanguageManagementConfig } from '@lsw-abpvue/language-management/config';
// abpv:end language-management
// abpv:begin text-template-management
import { provideTextTemplateManagementConfig } from '@lsw-abpvue/text-template-management/config';
// abpv:end text-template-management
// abpv:begin openiddict-pro
import { provideOpenIddictProConfig } from '@lsw-abpvue/openiddict-pro/config';
// abpv:end openiddict-pro
// abpv:begin gdpr
import { provideGdprConfig } from '@lsw-abpvue/gdpr/config';
// abpv:end gdpr
import App from './App.vue';
import { defaultEnvironment } from './env';
import { developmentEnvironment } from './development';
import { routes } from './routes';
import { describeStartupError, startupError } from './startup';

// Resolved at runtime, not baked in: `public/dynamic-env.json` wins, then `VITE_API_URL`
// and friends, then the defaults in `src/env.ts` (decision D11).
const loadedEnvironment = await loadRuntimeConfig({ defaults: defaultEnvironment });
const environment = import.meta.env.DEV
  ? developmentEnvironment(loadedEnvironment, globalThis.location.origin)
  : loadedEnvironment;

const { mount } = await createAbpApp(App, {
  providers: [
    provideAbpCore(withOptions({ environment })),
    provideAbpRouter(routes),
    // Fills in the AuthService core declares. Which flow runs is read from
    // `environment.oAuthConfig.responseType`, not chosen here.
    provideAbpOAuth(),
    // The theme: the twelve contract components, the three layouts, the error handlers.
    provideAbpThemeBasic(),
    // The modules' menu entries and the profile page's tabs. Small and synchronous; the
    // pages themselves arrive on the first navigation into them.
    // abpv:begin account
    provideAccountConfig(),
    provideManageProfileTabs(),
    // abpv:end account
    // abpv:begin identity
    provideIdentityConfig(),
    // abpv:end identity
    // abpv:begin tenant-management
    provideTenantManagementConfig(),
    // abpv:end tenant-management
    // abpv:begin account-pro
    provideAccountProConfig({
      appName: '__ACCOUNT_APP_NAME__',
      hostOrigin: environment.application?.baseUrl,
      trustedOrigins: [new URL(environment.application?.baseUrl || '__APP_URL__').origin],
    }),
    // abpv:end account-pro
    // abpv:begin identity-pro
    provideIdentityProConfig(),
    // abpv:end identity-pro
    // abpv:begin saas
    provideSaasConfig(),
    // abpv:end saas
    // abpv:begin audit-logging
    provideAuditLoggingConfig(),
    // abpv:end audit-logging
    // abpv:begin language-management
    provideLanguageManagementConfig(),
    // abpv:end language-management
    // abpv:begin text-template-management
    provideTextTemplateManagementConfig(),
    // abpv:end text-template-management
    // abpv:begin openiddict-pro
    provideOpenIddictProConfig(),
    // abpv:end openiddict-pro
    // abpv:begin gdpr
    provideGdprConfig(),
    // abpv:end gdpr
    // Setting management before feature management: the tab tree lives in the first, and
    // the second puts one of its own into it.
    // abpv:begin setting-management
    provideSettingManagementConfig(),
    // abpv:end setting-management
    // abpv:begin account-pro-admin
    provideAccountProAdminConfig(),
    // abpv:end account-pro-admin
    // abpv:begin feature-management
    provideFeatureManagementConfig(),
    // abpv:end feature-management
    // Without one of these an unreachable backend would leave a blank page.
    provideAppInitErrorHandler(error => {
      startupError.value = describeStartupError(error);
    }),
  ],
});

mount('#app');
