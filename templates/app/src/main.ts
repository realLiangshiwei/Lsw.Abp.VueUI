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
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@lsw-abpvue/theme-basic/style.css';
import App from './App.vue';
import { defaultEnvironment } from './env';
import { routes } from './routes';
import { describeStartupError, startupError } from './startup';

// Resolved at runtime, not baked in: `public/dynamic-env.json` wins, then `VITE_API_URL`
// and friends, then the defaults in `src/env.ts` (decision D11).
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
    // Setting management before feature management: the tab tree lives in the first, and
    // the second puts one of its own into it.
    // abpv:begin setting-management
    provideSettingManagementConfig(),
    // abpv:end setting-management
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
