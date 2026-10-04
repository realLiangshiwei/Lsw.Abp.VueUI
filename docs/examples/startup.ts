import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@lsw-abpvue/theme-basic/style.css';
import { createAbpApp, loadRuntimeConfig, provideAbpCore, withOptions } from '@lsw-abpvue/core';
import { provideAbpRouter } from '@lsw-abpvue/core/router';
import { provideIdentityConfig } from '@lsw-abpvue/identity/config';
import { provideAbpOAuth } from '@lsw-abpvue/oauth';
import { provideAbpThemeBasic } from '@lsw-abpvue/theme-basic';
import App from './App.vue';
import { routes } from './routes';

const environment = await loadRuntimeConfig();
const { mount } = await createAbpApp(App, {
  providers: [
    provideAbpCore(withOptions({ environment })),
    provideAbpRouter(routes),
    provideAbpOAuth(),
    provideAbpThemeBasic(),
    provideIdentityConfig(),
  ],
});
mount('#app');
