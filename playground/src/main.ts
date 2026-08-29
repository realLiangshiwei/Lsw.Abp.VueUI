import { createAbpApp, provideAppInitializer } from '@lsw-abpvue/core';
import App from './App.vue';
import { GREETING_TEMPLATE } from './services/greeting';

const { mount } = await createAbpApp(App, {
  providers: [
    // Replacing a service or a configuration value is one line.
    { provide: GREETING_TEMPLATE, useValue: 'Hei {0}, from the root injector.' },
    provideAppInitializer(async () => {
      // Startup work the application waits for. From M1.B on this is where the tenant,
      // the session and the application configuration are resolved.
      await Promise.resolve();
    }),
  ],
});

mount('#app');
