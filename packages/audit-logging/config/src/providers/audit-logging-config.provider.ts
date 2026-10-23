import {
  ConfigStateService,
  inject,
  LayoutType,
  makeEnvironmentProviders,
  onServiceDestroy,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import { ThemeSharedRouteNames } from '@lsw-abpvue/theme-shared';
import { defineAsyncComponent, watch } from 'vue';
import { AuditLoggingPolicyNames, AuditLoggingRouteNames } from '../enums/route-names.js';
import { isAuditLoggingEnabled } from '../utils/features.js';
import { provideAuditLogging } from './audit-logging.provider.js';

/** Registers audit navigation, settings and the optional entity history host. */
export function provideAuditLoggingConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...provideAuditLogging(),
    provideAppInitializer(() => {
      const config = inject(ConfigStateService);
      const routes = inject(RoutesService);
      routes.add([
        {
          name: AuditLoggingRouteNames.AuditLogging,
          path: '/audit-logs',
          parentName: ThemeSharedRouteNames.Administration,
          requiredPolicy: AuditLoggingPolicyNames.AuditLogging,
          layout: LayoutType.application,
          iconClass: 'bi bi-file-text',
          order: 7,
        },
      ]);
      const stop = watch(
        () => isAuditLoggingEnabled(config),
        enabled => routes.patch(AuditLoggingRouteNames.AuditLogging, { invisible: !enabled }),
        { immediate: true, flush: 'sync' },
      );
      onServiceDestroy(stop);
      inject(SettingTabsService).add([
        {
          name: AuditLoggingRouteNames.AuditLogging,
          order: 100,
          requiredPolicy: AuditLoggingPolicyNames.SettingManagement,
          visible: () =>
            config.snapshot().features.values['AuditLogging.SettingManagement']?.toLowerCase() !==
            'false',
          component: defineAsyncComponent(() => import('../components/AuditLogSettings.vue')),
        },
      ]);
    }),
  ]);
}
