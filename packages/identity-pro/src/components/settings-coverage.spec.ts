import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  LocalizationService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { IdentitySettingsService } from '@lsw-abpvue/identity-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IdentitySettings from '../../config/src/components/IdentitySettings.vue';
const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});
async function setup(failed = false) {
  const get = vi.fn(async () => {
    if (failed) throw new TypeError('Unavailable');
    return {
      password: { requiredLength: 12, requiredUniqueChars: 1 },
      lockout: { maxFailedAccessAttempts: 5 },
      signIn: {},
      user: {},
    };
  });
  const injector = createInjector([
    ...plainTheme.providers,
    {
      provide: IdentitySettingsService,
      useValue: {
        get,
        getLdap: vi.fn(async () => ({ enableLdapLogin: true, ldapPassword: 'hidden-secret' })),
        getOAuth: vi.fn(async () => ({
          clientId: 'example-client',
          clientSecret: 'hidden-secret',
        })),
        getSession: vi.fn(async () => ({ preventConcurrentLogin: 0 })),
      },
    },
  ]);
  injectors.push(injector);
  vi.spyOn(injector.get(LocalizationService), 't').mockImplementation(key => String(key));
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    auth: { grantedPolicies: { 'AbpIdentity.SettingManagement': true } },
    features: {
      values: { 'Account.EnableLdapLogin': 'true', 'Identity.EnableOAuthLogin': 'true' },
    },
  });
  const wrapper = mount(IdentitySettings, {
    global: { provide: { [ABP_INJECTOR_KEY]: injector }, mocks: { $t: (key: string) => key } },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, config, get };
}
describe('identity settings', () => {
  it('renders every enabled settings tab without exposing stored secrets', async () => {
    const { wrapper } = await setup();
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs).toHaveLength(7);
    for (const tab of tabs) {
      await tab.trigger('click');
      await flushPromises();
      expect(wrapper.find('form').exists()).toBe(true);
      expect(wrapper.html()).not.toContain('hidden-secret');
    }
  });
  it('retries a failed read', async () => {
    const { wrapper, get } = await setup(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    await wrapper.get('button:not([role="tab"])').trigger('click');
    await flushPromises();
    expect(get).toHaveBeenCalledTimes(2);
  });
  it('removes settings when permission is revoked', async () => {
    const { wrapper, config } = await setup();
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    await flushPromises();
    expect(wrapper.find('form').exists()).toBe(false);
  });
});
