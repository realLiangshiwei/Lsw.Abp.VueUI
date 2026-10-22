import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AccountAdminSettings, AccountSettingSection } from '../models/settings.js';
import { AccountSettingsService } from '@lsw-abpvue/account-pro/proxy';
import AccountSettings from './AccountSettings.vue';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});
async function setup(allowed = true, sharedTenant = false) {
  const settings: Pick<AccountAdminSettings, 'general' | 'external' | 'twoFactor' | 'captcha'> = {
    general: {
      isSelfRegistrationEnabled: true,
      enableLocalLogin: true,
      preventEmailEnumeration: false,
    },
    external: {
      verifyPasswordDuringExternalLogin: false,
      externalProviders: [
        {
          name: 'Example',
          enabled: true,
          enabledForTenantUser: true,
          useCustomSettings: false,
          properties: [{ name: 'ClientId', value: 'original-client' }],
          secretProperties: [{ name: 'ClientSecret', value: 'original-secret' }],
        },
      ],
    },
    twoFactor: { twoFactorBehaviour: 0, usersCanChange: true, isRememberBrowserEnabled: true },
    captcha: {
      useCaptchaOnLogin: true,
      useCaptchaOnRegistration: true,
      useCaptchaOnForgotPassword: true,
      siteKey: 'site-key',
      siteSecret: 'site-secret',
      verifyBaseUrl: 'https://www.google.com/',
      version: 2,
      score: 0.5,
    },
  };
  const get = vi.fn((section: AccountSettingSection) =>
    Promise.resolve(structuredClone(settings[section as keyof typeof settings])),
  );
  const update = vi.fn<
    (section: AccountSettingSection, body: unknown, config: unknown) => Promise<void>
  >(() => Promise.resolve());
  const injector = createInjector([
    ...plainTheme.providers,
    {
      provide: AccountSettingsService,
      useValue: {
        get: () => get('general'),
        update: (body: unknown, config: unknown) => update('general', body, config),
        getTwoFactor: () => get('twoFactor'),
        updateTwoFactor: (body: unknown, config: unknown) => update('twoFactor', body, config),
        getRecaptcha: () => get('captcha'),
        updateRecaptcha: (body: unknown, config: unknown) => update('captcha', body, config),
        getExternalProvider: () => get('external'),
        updateExternalProvider: (body: unknown, config: unknown) =>
          update('external', body, config),
      },
    },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentTenant: { isAvailable: sharedTenant, id: sharedTenant ? 'shared-tenant' : null },
    multiTenancy: { ...config.snapshot().multiTenancy, userSharingStrategy: sharedTenant ? 1 : 0 },
    auth: { grantedPolicies: { 'AbpAccount.SettingManagement': allowed } },
    features: { values: { 'Identity.TwoFactor': 'Optional' } },
  });
  vi.spyOn(config, 'refreshAppState').mockImplementation(() => Promise.resolve(config.snapshot()));
  const wrapper = mount(AccountSettings, {
    global: {
      provide: { [ABP_INJECTOR_KEY as symbol]: injector },
      mocks: { $t: (key: string) => key },
    },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, settings, get, update, config };
}
describe('commercial account settings', () => {
  it('shows only tenant-editable CAPTCHA fields and the score only for v3', async () => {
    const { wrapper, config } = await setup();
    config.setState({
      ...config.snapshot(),
      currentTenant: { id: 'tenant-id', isAvailable: true },
    });
    await flushPromises();
    await wrapper
      .findAll('[role="tab"]')
      .find(tab => tab.text().includes('Captcha'))
      ?.trigger('click');
    await flushPromises();
    expect(wrapper.find('input[name="siteKey"]').exists()).toBe(true);
    expect(wrapper.find('input[name="verifyBaseUrl"]').exists()).toBe(false);
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
    expect(wrapper.find('input[name="score"]').exists()).toBe(false);
    const version = wrapper.find('select');
    expect(version.exists()).toBe(true);
    await version.setValue('3');
    await flushPromises();
    expect(wrapper.find('input[name="score"]').exists()).toBe(true);
    expect(wrapper.get('input[name="score"]').attributes('min')).toBe('0');
  });
  it('offers the official two-factor values and hides user choice when it is forced', async () => {
    const { wrapper } = await setup();
    await wrapper
      .findAll('[role="tab"]')
      .find(b => b.text().includes('AccountSettingsTwoFactor'))
      ?.trigger('click');
    await flushPromises();
    expect(wrapper.findAll('option').map(option => option.text())).toEqual([
      'Optional',
      'Disabled',
      'Forced',
    ]);
    expect(wrapper.text()).toContain('AbpIdentity::DisplayName:Abp.Identity.UsersCanChange');
    await wrapper.get('select').setValue('2');
    await flushPromises();
    expect(wrapper.text()).not.toContain('AbpIdentity::DisplayName:Abp.Identity.UsersCanChange');
  });
  it('merges the edited general setting into a fresh server read', async () => {
    const { wrapper, settings, update } = await setup();
    await wrapper.findAll('input[type="checkbox"]')[0]?.setValue(false);
    settings.general.preventEmailEnumeration = true;
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(update).toHaveBeenCalledWith(
      'general',
      {
        isSelfRegistrationEnabled: false,
        enableLocalLogin: true,
        preventEmailEnumeration: true,
      },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
  it('preserves concurrently rotated provider secrets when only a public property changed', async () => {
    const { wrapper, settings, update } = await setup();
    await wrapper
      .findAll('button')
      .find(b => b.text().includes('AccountExternalProviderSettings'))
      ?.trigger('click');
    await flushPromises();
    await wrapper.get('input[type="text"]').setValue('edited-client');
    const provider = settings.external.externalProviders?.[0];
    if (!provider?.secretProperties?.[0]) throw new Error('Missing provider fixture');
    provider.secretProperties[0].value = 'rotated-secret';
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(update).toHaveBeenCalledWith(
      'external',
      expect.objectContaining({
        externalProviders: [
          expect.objectContaining({
            properties: [{ name: 'ClientId', value: 'edited-client' }],
            secretProperties: [{ name: 'ClientSecret', value: 'rotated-secret' }],
          }),
        ],
      }),
      expect.anything(),
    );
  });
  it('uses application localization for external provider property labels', async () => {
    const { wrapper, config } = await setup();
    config.setState({
      ...config.snapshot(),
      localization: {
        ...config.snapshot().localization,
        defaultResourceName: 'ExampleApp',
        values: { ExampleApp: { 'ExternalProvider:Example:ClientId': 'Public client identifier' } },
      },
    });
    await wrapper
      .findAll('[role="tab"]')
      .find(tab => tab.text().includes('AccountExternalProviderSettings'))
      ?.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Public client identifier');
    expect(wrapper.text()).toContain('ClientSecret');
  });
  it('requires an explicit read after an uncertain save', async () => {
    const { wrapper, get, update } = await setup();
    update.mockRejectedValueOnce(new Error('Connection interrupted after send'));
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe('AbpUi::DefaultErrorMessage');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(update).toHaveBeenCalledOnce();
    await wrapper
      .findAll('button')
      .find(b => b.text() === 'AbpUi::Refresh')
      ?.trigger('click');
    await flushPromises();
    expect(get).toHaveBeenCalledTimes(3);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(update).toHaveBeenCalledTimes(2);
  });
  it.each([
    [false, false],
    [true, true],
  ])(
    'does not read administrator data when permission=%s and sharedTenant=%s',
    async (permission, sharedTenant) => {
      const { wrapper, get, update } = await setup(permission, sharedTenant);
      expect(wrapper.find('form').exists()).toBe(false);
      expect(get).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    },
  );
});
