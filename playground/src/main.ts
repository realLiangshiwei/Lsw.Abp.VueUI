import {
  createAbpApp,
  provideAbpCore,
  provideAppInitErrorHandler,
  withOptions,
} from '@lsw-abpvue/core';
import App from './App.vue';
import { GREETING_TEMPLATE } from './services/greeting';
import { describeStartupError, environment, startupError } from './startup';

const { mount } = await createAbpApp(App, {
  providers: [
    provideAbpCore(withOptions({ environment })),
    // Without one of these an unreachable backend would leave a blank page.
    provideAppInitErrorHandler(error => {
      startupError.value = describeStartupError(error);
    }),
    // Replacing a service or a configuration value is one line.
    { provide: GREETING_TEMPLATE, useValue: 'Hei {0}, from the root injector.' },
  ],
});

mount('#app');
