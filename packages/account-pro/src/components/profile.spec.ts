import {
  ABP_INJECTOR_KEY,
  AuthService,
  ConfigStateService,
  LocalizationService,
  createInjector,
  runInInjectionContext,
  type Injector,
} from '@lsw-abpvue/core';
import {
  ACCOUNT_PRO_OPTIONS,
  AccountProProfileStateService,
  AccountProProfileTabs,
} from '@lsw-abpvue/account-pro/config';
import {
  AccountService,
  ProfileService,
  type ProfileDto,
  type UpdateProfileDto,
} from '@lsw-abpvue/account-pro/proxy';
import { ManageProfileTabsService } from '@lsw-abpvue/account-core';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { computed } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { accountProExtensionsResolver } from '../resolvers/extensions.resolver.js';
import PersonalSettingsTab from './PersonalSettingsTab.vue';
import ManageProfilePage from './ManageProfilePage.vue';
import { ReplaceableComponentsService } from '@lsw-abpvue/core';
import { defineComponent } from 'vue';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});
const profile: ProfileDto = {
  userName: 'member',
  email: 'member@example.test',
  phoneNumber: '5550100',
  name: 'Original',
  emailConfirmed: false,
  phoneNumberConfirmed: false,
  isExternal: false,
  hasPassword: true,
  supportsMultipleTimezone: false,
  concurrencyStamp: 'original-stamp',
  extraProperties: { preserved: 'unknown value' },
};
async function setup(settings: Record<string, string> = {}) {
  const get = vi.fn(() => Promise.resolve({ ...profile, concurrencyStamp: 'fresh-stamp' }));
  const update = vi.fn((body: UpdateProfileDto) => Promise.resolve({ ...profile, ...body }));
  const refreshToken = vi.fn(() => Promise.resolve());
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: ProfileService, useValue: { get, update } },
    { provide: AccountService, useValue: {} },
    { provide: ACCOUNT_PRO_OPTIONS, useValue: { appName: 'Angular' } },
    { provide: AuthService, useValue: { isAuthenticated: computed(() => true), refreshToken } },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { ...config.snapshot().currentUser, id: 'member-id', isAuthenticated: true },
    setting: { values: settings },
  });
  config.refreshAppState = vi.fn(() => Promise.resolve(config.snapshot()));
  injector.get(AccountProProfileStateService).set(profile, true);
  runInInjectionContext(injector, accountProExtensionsResolver);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/account/manage', component: PersonalSettingsTab }],
  });
  await router.push('/account/manage');
  const wrapper = mount(PersonalSettingsTab, {
    global: {
      plugins: [router],
      provide: { [ABP_INJECTOR_KEY as symbol]: injector },
      mocks: { $t: (key: string) => key },
    },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, update, get, refreshToken, injector, config };
}
describe('commercial personal settings', () => {
  it('shows phone confirmation only when the server allows it', async () => {
    const { wrapper, config } = await setup();
    const verifyButtons = () =>
      wrapper.findAll('button').filter(b => b.text() === 'AbpAccount::Verify');
    expect(verifyButtons()).toHaveLength(1);
    config.setState({
      ...config.snapshot(),
      setting: { values: { 'Abp.Identity.SignIn.EnablePhoneNumberConfirmation': 'True' } },
    });
    await flushPromises();
    expect(verifyButtons()).toHaveLength(2);
  });
  it.each(Object.values(AccountProProfileTabs))(
    'replaces the official profile tab %s',
    async key => {
      const { injector, config } = await setup({
        'Abp.Identity.TwoFactor.Behaviour': 'Optional',
        'Abp.Identity.TwoFactor.UsersCanChange': 'true',
      });
      config.setState({
        ...config.snapshot(),
        features: { values: { 'Identity.TwoFactor': 'Optional' } },
      });
      const service = injector.get(ProfileService);
      service.canEnableTwoFactor = vi.fn(() => Promise.resolve(true));
      injector.get(ReplaceableComponentsService).add({
        key,
        component: defineComponent({ template: '<p>Replaced profile tab</p>' }),
      });
      const wrapper = mount(ManageProfilePage, {
        global: {
          provide: { [ABP_INJECTOR_KEY as symbol]: injector },
          mocks: { $t: (value: string) => value },
        },
      });
      wrappers.push(wrapper);
      await flushPromises();
      const label = injector.get(LocalizationService).t(key);
      const tab = wrapper.findAll('[role="tab"]').find(tab => tab.text() === label);
      expect(tab).toBeDefined();
      await tab?.trigger('click');
      await flushPromises();
      expect(wrapper.get('[role="tabpanel"]').text()).toBe('Replaced profile tab');
    },
  );
  it('saves a visible edit with the current concurrency stamp, application and unknown extensions', async () => {
    const { wrapper, update, refreshToken } = await setup();
    await wrapper.get('input[name="name"]').setValue('Updated');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated',
        userName: 'member',
        appName: 'Angular',
        concurrencyStamp: 'original-stamp',
        extraProperties: { preserved: 'unknown value' },
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });
  it('requires a fresh read after an interrupted save and then sends the new stamp', async () => {
    const { wrapper, update, get } = await setup();
    update.mockRejectedValueOnce(new TypeError('Connection interrupted'));
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    await wrapper.get('form').trigger('submit');
    expect(update).toHaveBeenCalledTimes(1);
    const reload = wrapper.findAll('button').find(button => button.text() === 'AbpUi::Refresh');
    expect(reload).toBeDefined();
    await reload?.trigger('click');
    await flushPromises();
    expect(get).toHaveBeenCalledTimes(1);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(update).toHaveBeenLastCalledWith(
      expect.objectContaining({ concurrencyStamp: 'fresh-stamp' }),
      expect.anything(),
    );
  });
  it('makes forbidden username and email edits read-only', async () => {
    const { wrapper } = await setup({
      'Abp.Identity.User.IsUserNameUpdateEnabled': 'false',
      'Abp.Identity.User.IsEmailUpdateEnabled': 'false',
    });
    expect(wrapper.get('input[name="userName"]').attributes()).toHaveProperty('readonly');
    expect(wrapper.get('input[name="email"]').attributes()).toHaveProperty('readonly');
  });
  it('requires the feature, setting, user choice and server capability for both security tabs', async () => {
    const { injector, config } = await setup({
      'Abp.Identity.TwoFactor.Behaviour': 'Optional',
      'Abp.Identity.TwoFactor.UsersCanChange': 'true',
    });
    const tabs = injector.get(ManageProfileTabsService);
    const visible = () => tabs.visible.value.map(tab => tab.name);
    expect(visible()).not.toContain(AccountProProfileTabs.AuthenticatorApp);
    config.setState({
      ...config.snapshot(),
      features: { values: { 'Identity.TwoFactor': 'Optional' } },
    });
    expect(visible()).toContain(AccountProProfileTabs.AuthenticatorApp);
    expect(visible()).toContain(AccountProProfileTabs.TwoFactor);
    injector.get(AccountProProfileStateService).set(profile, false);
    expect(visible()).not.toContain(AccountProProfileTabs.TwoFactor);
  });
});
