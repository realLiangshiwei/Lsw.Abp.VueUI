import {
  ConfigStateService,
  DocumentService,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  provideAppSetup,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import { createVNode, defineAsyncComponent, render } from 'vue';

/** Registers commercial account settings independently of public account pages. */
export function provideAccountProAdminConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppSetup(async (app, injector) => {
      const document = injector.get(DocumentService).nativeDocument;
      if (!document) return;
      const { IdleSessionModal } = await import('@lsw-abpvue/account-pro/admin');
      const container = document.createElement('div');
      document.body.append(container);
      const vnode = createVNode(IdleSessionModal);
      vnode.appContext = app._context;
      render(vnode, container);
      app.onUnmount(() => {
        render(null, container);
        container.remove();
      });
    }),
    provideAppInitializer(() => {
      const config = inject(ConfigStateService);
      inject(SettingTabsService).add([
        {
          name: 'AbpAccount::Menu:Account',
          order: 100,
          requiredPolicy: 'AbpAccount.SettingManagement',
          component: defineAsyncComponent(() =>
            import('@lsw-abpvue/account-pro/admin').then(m => m.AccountSettings),
          ),
          visible: () =>
            !config.snapshot().currentTenant.id ||
            config.snapshot().multiTenancy.userSharingStrategy !== 1,
        },
      ]);
    }),
  ]);
}
