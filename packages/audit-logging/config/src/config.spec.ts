import {
  APP_INITIALIZERS,
  ConfigStateService,
  createInjector,
  RoutesService,
} from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import { describe, expect, it } from 'vitest';
import { provideAuditLoggingConfig } from './index.js';

describe('audit configuration', () => {
  it('registers one menu and settings tab and follows runtime feature changes', () => {
    const injector = createInjector([provideAuditLoggingConfig()]);
    try {
      for (const initializer of injector.get(APP_INITIALIZERS, []))
        injector.runInContext(initializer);
      const routes = injector.get(RoutesService);
      const config = injector.get(ConfigStateService);
      const settings = injector.get(SettingTabsService);
      expect(routes.flat.value).toMatchObject([
        {
          name: 'AbpAuditLogging::Menu:AuditLogging',
          path: '/audit-logs',
          requiredPolicy: 'AuditLogging.AuditLogs',
          invisible: false,
        },
      ]);
      expect(settings.flat.value).toHaveLength(1);
      expect(settings.flat.value[0]?.requiredPolicy).toBe(
        'AuditLogging.AuditLogs.SettingManagement',
      );
      config.setState({
        ...config.snapshot(),
        features: {
          values: { 'AuditLogging.Enable': 'false', 'AuditLogging.SettingManagement': 'false' },
        },
      });
      expect(routes.flat.value[0]?.invisible).toBe(true);
      expect(settings.flat.value[0]?.visible?.()).toBe(false);
      config.setState({
        ...config.snapshot(),
        features: {
          values: { 'AuditLogging.Enable': 'true', 'AuditLogging.SettingManagement': 'true' },
        },
      });
      expect(routes.flat.value[0]?.invisible).toBe(false);
      expect(settings.flat.value[0]?.visible?.()).toBe(true);
    } finally {
      injector.destroy();
    }
  });
});
