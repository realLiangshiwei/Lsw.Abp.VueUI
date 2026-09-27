import { createAbpApp, LocalizationService, provideAppSetup } from '@lsw-abpvue/core';
import { provideAbpRouter } from '@lsw-abpvue/core/router';
import { EXTENSIONS_IDENTIFIER } from '@lsw-abpvue/components';
import { provideAbpThemeBasic } from '@lsw-abpvue/theme-basic';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@lsw-abpvue/theme-basic/style.css';
import BenchmarkPage from './BenchmarkPage.vue';

const { mount } = await createAbpApp(BenchmarkPage, {
  providers: [
    provideAbpThemeBasic(),
    provideAbpRouter([
      {
        path: '/:pathMatch(.*)*',
        component: BenchmarkPage,
        meta: { title: 'Browser benchmarks' },
      },
    ]),
    { provide: EXTENSIONS_IDENTIFIER, useValue: 'Benchmarks.Records' },
    provideAppSetup((app, injector) => {
      app.config.globalProperties.$t = injector.get(LocalizationService).t;
    }),
  ],
});

mount('#app');
