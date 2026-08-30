import {
  createAbpApp,
  loadRuntimeConfig,
  provideAbpCore,
  provideAppInitErrorHandler,
  withOptions,
} from '@lsw-abpvue/core';
import { provideAbpRouter } from '@lsw-abpvue/core/router';
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
    // Without one of these an unreachable backend would leave a blank page.
    provideAppInitErrorHandler(error => {
      startupError.value = describeStartupError(error);
    }),
    // Replacing a service or a configuration value is one line.
    { provide: GREETING_TEMPLATE, useValue: 'Hei {0}, from the root injector.' },
  ],
});

mount('#app');
