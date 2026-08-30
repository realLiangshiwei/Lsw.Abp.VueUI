import { describe, expect, it } from 'vitest';
import { createInjector } from '../di/injector';
import type { ApplicationConfigurationDto } from '../proxy/models';
import { ConfigStateService } from './config-state.service';
import { CurrentUserService } from './current-user.service';
import { FeatureService } from './feature.service';
import { SettingService } from './setting.service';

function context(overrides: Partial<ApplicationConfigurationDto>) {
  const injector = createInjector([]);
  const configState = injector.get(ConfigStateService);
  configState.setState({ ...configState.snapshot(), ...overrides });

  return injector;
}

describe('SettingService', () => {
  const injector = () =>
    context({
      setting: {
        values: {
          'Abp.Localization.DefaultLanguage': 'en',
          'Abp.Account.IsSelfRegistrationEnabled': 'true',
          'Abp.Account.EnableLocalLogin': 'False',
        },
      },
    });

  it('reads a setting by name', () => {
    expect(injector().get(SettingService).get('Abp.Localization.DefaultLanguage').value).toBe('en');
  });

  it('a setting that is not there is undefined', () => {
    expect(injector().get(SettingService).get('Nope').value).toBeUndefined();
  });

  it('a boolean setting is case insensitive', () => {
    const settings = injector().get(SettingService);

    expect(settings.getBoolean('Abp.Account.IsSelfRegistrationEnabled').value).toBe(true);
    expect(settings.getBoolean('Abp.Account.EnableLocalLogin').value).toBe(false);
    expect(settings.getBoolean('Nope').value).toBe(false);
  });

  it('filters a group of settings by keyword', () => {
    expect(Object.keys(injector().get(SettingService).getAll('Abp.Account').value)).toEqual([
      'Abp.Account.IsSelfRegistrationEnabled',
      'Abp.Account.EnableLocalLogin',
    ]);
  });

  it('follows a configuration refresh', () => {
    const services = injector();
    const language = services.get(SettingService).get('Abp.Localization.DefaultLanguage');
    const configState = services.get(ConfigStateService);

    configState.setState({
      ...configState.snapshot(),
      setting: { values: { 'Abp.Localization.DefaultLanguage': 'tr' } },
    });

    expect(language.value).toBe('tr');
  });
});

describe('FeatureService', () => {
  const injector = () =>
    context({
      features: { values: { 'SettingManagement.Enable': 'true', 'Chat.Enable': 'false' } },
      globalFeatures: { enabledFeatures: ['Volo.Chat'] },
    });

  it('reads a feature value by name', () => {
    expect(injector().get(FeatureService).get('SettingManagement.Enable').value).toBe('true');
  });

  it('true as a string is on', () => {
    const features = injector().get(FeatureService);

    expect(features.isEnabled('SettingManagement.Enable').value).toBe(true);
    expect(features.isEnabled('Chat.Enable').value).toBe(false);
    expect(features.isEnabled('Nope').value).toBe(false);
  });

  it('global features come from a list of their own', () => {
    const features = injector().get(FeatureService);

    expect(features.isGlobalEnabled('Volo.Chat').value).toBe(true);
    expect(features.isGlobalEnabled('SettingManagement.Enable').value).toBe(false);
  });
});

describe('CurrentUserService', () => {
  it('nothing is there for an anonymous visitor', () => {
    const user = context({}).get(CurrentUserService);

    expect(user.isAuthenticated.value).toBe(false);
    expect(user.roles.value).toEqual([]);
    expect(user.isImpersonating.value).toBe(false);
  });

  it('the user and the roles are readable once signed in', () => {
    const user = context({
      currentUser: {
        isAuthenticated: true,
        userName: 'admin',
        roles: ['admin'],
        emailVerified: true,
        phoneNumberVerified: false,
      },
    }).get(CurrentUserService);

    expect(user.isAuthenticated.value).toBe(true);
    expect(user.user.value.userName).toBe('admin');
    expect(user.roles.value).toEqual(['admin']);
  });

  it('reports impersonating while somebody is acting as this user', () => {
    const user = context({
      currentUser: {
        isAuthenticated: true,
        impersonatorUserId: 'admin-id',
        roles: [],
        emailVerified: false,
        phoneNumberVerified: false,
      },
    }).get(CurrentUserService);

    expect(user.isImpersonating.value).toBe(true);
  });
});
