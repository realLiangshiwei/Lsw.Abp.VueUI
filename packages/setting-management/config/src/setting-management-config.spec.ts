import {
  APP_INITIALIZERS,
  ConfigStateService,
  createInjector,
  RoutesService,
  runInInjectionContext,
  type ApplicationConfigurationDto,
  type Injector,
} from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { SettingManagementPolicyNames } from './enums/policy-names.js';
import { SettingManagementRouteNames } from './enums/route-names.js';
import { SettingManagementTabNames } from './enums/tab-names.js';
import { provideSettingManagementConfig } from './providers/setting-management-config.provider.js';
import { SettingTabsService } from './services/setting-tabs.service.js';

interface State {
  policies?: string[];
  features?: Record<string, string>;
  clockKind?: string;
  tenantId?: string | null;
}

/** What `createAbpApp` does at startup, against a configuration the test decides. */
function start(state: State = {}): Injector {
  const injector = createInjector([provideSettingManagementConfig()]);
  const configState = injector.get(ConfigStateService);

  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: Object.fromEntries((state.policies ?? []).map(n => [n, true])) },
    features: { values: state.features ?? { 'SettingManagement.Enable': 'true' } },
    clock: { kind: state.clockKind ?? 'Unspecified' },
    currentTenant: { id: state.tenantId ?? null, name: null, isAvailable: state.tenantId != null },
  } as ApplicationConfigurationDto);

  for (const initializer of injector.get(APP_INITIALIZERS, [], { optional: true })) {
    runInInjectionContext(injector, initializer);
  }

  return injector;
}

const settingsRoute = (injector: Injector) =>
  injector
    .get(RoutesService)
    .flat.value.find(route => route.name === SettingManagementRouteNames.Settings);

const ALL = [
  SettingManagementPolicyNames.Emailing,
  SettingManagementPolicyNames.EmailingTest,
  SettingManagementPolicyNames.TimeZone,
];

describe('provideSettingManagementConfig', () => {
  it('files the settings page under administration', () => {
    const route = settingsRoute(start());

    expect(route?.path).toBe('/setting-management');
    expect(route?.parentName).toBe('AbpUiNavigation::Menu:Administration');
  });

  it('brings the emailing tab, behind its own permission', () => {
    const tabs = start({ policies: ALL }).get(SettingTabsService);

    expect(tabs.visible.value.map(tab => tab.name)).toContain(
      SettingManagementTabNames.EmailSettingGroup,
    );
    expect(start().get(SettingTabsService).visible.value).toEqual([]);
  });

  it('offers a time zone only where the backend has more than one', () => {
    const withoutUtc = start({ policies: ALL }).get(SettingTabsService);
    expect(withoutUtc.visible.value.map(tab => tab.name)).not.toContain(
      SettingManagementTabNames.TimeZoneSettingGroup,
    );

    const withUtc = start({ policies: ALL, clockKind: 'Utc' }).get(SettingTabsService);
    expect(withUtc.visible.value.map(tab => tab.name)).toContain(
      SettingManagementTabNames.TimeZoneSettingGroup,
    );
  });

  it('drops the emailing tab a tenant has the feature switched off for', () => {
    const tabs = start({
      policies: ALL,
      tenantId: 'tenant-1',
      features: {
        'SettingManagement.Enable': 'true',
        'SettingManagement.AllowChangingEmailSettings': 'false',
      },
    }).get(SettingTabsService);

    expect(tabs.visible.value).toEqual([]);
  });

  it('keeps the menu entry away while nothing is behind it', async () => {
    expect(settingsRoute(start())?.invisible).toBe(true);

    const granted = start({ policies: ALL });
    await nextTick();
    expect(settingsRoute(granted)?.invisible).toBe(false);
  });

  it('keeps the menu entry away when the feature is off', async () => {
    const injector = start({ policies: ALL, features: { 'SettingManagement.Enable': 'false' } });
    await nextTick();

    expect(settingsRoute(injector)?.invisible).toBe(true);
  });
});
