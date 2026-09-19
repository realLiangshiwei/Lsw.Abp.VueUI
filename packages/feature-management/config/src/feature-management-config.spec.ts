import {
  APP_INITIALIZERS,
  ConfigStateService,
  createInjector,
  runInInjectionContext,
  type ApplicationConfigurationDto,
  type Injector,
} from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import { describe, expect, it } from 'vitest';
import { FeatureManagementTabNames } from './enums/tab-names.js';
import { provideFeatureManagementConfig } from './providers/feature-management-config.provider.js';

function start(policies: string[] = []): Injector {
  const injector = createInjector([provideFeatureManagementConfig()]);
  const configState = injector.get(ConfigStateService);

  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: Object.fromEntries(policies.map(name => [name, true])) },
  } as ApplicationConfigurationDto);

  for (const initializer of injector.get(APP_INITIALIZERS, [], { optional: true })) {
    runInInjectionContext(injector, initializer);
  }

  return injector;
}

describe('provideFeatureManagementConfig', () => {
  it('puts the host features on the settings page', () => {
    const tabs = start(['FeatureManagement.ManageHostFeatures']).get(SettingTabsService);

    expect(tabs.visible.value.map(tab => tab.name)).toEqual([
      FeatureManagementTabNames.FeatureManagement,
    ]);
  });

  it('keeps it from whoever may not manage them', () => {
    expect(start().get(SettingTabsService).visible.value).toEqual([]);
  });
});
