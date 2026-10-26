import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@lsw-abpvue/theme-basic/style.css';
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
import { provideManageProfileTabs } from '@lsw-abpvue/account';
import { provideAccountConfig } from '@lsw-abpvue/account/config';
import { provideFeatureManagementConfig } from '@lsw-abpvue/feature-management/config';
import { provideIdentityConfig } from '@lsw-abpvue/identity/config';
import { provideIdentityProConfig } from '@lsw-abpvue/identity-pro/config';
import { provideAuditLoggingConfig } from '@lsw-abpvue/audit-logging/config';
import { provideAccountProConfig } from '@lsw-abpvue/account-pro/config';
import { provideAccountProAdminConfig } from '@lsw-abpvue/account-pro/admin/config';
import { provideSettingManagementConfig } from '@lsw-abpvue/setting-management/config';
import { provideTenantManagementConfig } from '@lsw-abpvue/tenant-management/config';
import { provideSaasConfig } from '@lsw-abpvue/saas/config';
import { provideLanguageManagementConfig } from '@lsw-abpvue/language-management/config';
import { provideTextTemplateManagementConfig } from '@lsw-abpvue/text-template-management/config';
import App from './App.vue';
import { routes } from './routes';
import { defaultEnvironment, describeStartupError, startupError } from './startup';
import { GREETING_TEMPLATE } from './services/greeting';

// Resolved at runtime, not baked in: `public/dynamic-env.json` wins, then `VITE_API_URL`
// and friends, then the defaults below (decision D11).
const environment = await loadRuntimeConfig({ defaults: defaultEnvironment });

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
    // pages themselves arrive on the first navigation into them (design 03 §2).
    ...(import.meta.env.VITE_ABP_EDITION === 'pro'
      ? [
          provideAccountProConfig({
            appName: 'Angular',
            hostOrigin: 'http://localhost:5179',
            trustedOrigins: ['http://localhost:5179', 'http://127.0.0.1:5179'],
          }),
        ]
      : [provideAccountConfig(), provideManageProfileTabs()]),
    import.meta.env.VITE_ABP_EDITION === 'pro'
      ? provideIdentityProConfig()
      : provideIdentityConfig(),
    ...(import.meta.env.VITE_ABP_EDITION === 'pro' ? [provideAuditLoggingConfig()] : []),
    ...(import.meta.env.VITE_ABP_EDITION === 'pro' ? [provideLanguageManagementConfig()] : []),
    ...(import.meta.env.VITE_ABP_EDITION === 'pro' ? [provideTextTemplateManagementConfig()] : []),
    import.meta.env.VITE_ABP_EDITION === 'pro'
      ? provideSaasConfig()
      : provideTenantManagementConfig(),
    // Setting management before feature management: the tab tree lives in the first, and
    // the second puts one of its own into it.
    provideSettingManagementConfig(),
    ...(import.meta.env.VITE_ABP_EDITION === 'pro' ? [provideAccountProAdminConfig()] : []),
    provideFeatureManagementConfig(),
    // Without one of these an unreachable backend would leave a blank page.
    provideAppInitErrorHandler(error => {
      startupError.value = describeStartupError(error);
    }),
    // Replacing a service or a configuration value is one line.
    { provide: GREETING_TEMPLATE, useValue: 'Hei {0}, from the root injector.' },
  ],
});

mount('#app');
