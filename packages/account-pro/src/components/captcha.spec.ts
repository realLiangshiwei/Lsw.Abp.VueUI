import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  DocumentService,
  WindowService,
  type Injector,
} from '@lsw-abpvue/core';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AccountCaptcha from './AccountCaptcha.vue';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});
async function setup(version: '2' | '3', enabled = true, unavailable = false) {
  let events: {
    callback(token: string): void;
    'expired-callback'(): void;
    'error-callback'(): void;
  };
  const client = {
    ready: (callback: () => void) => callback(),
    render: vi.fn((_element: HTMLElement, options: typeof events) => {
      events = options;
      return 7;
    }),
    reset: vi.fn(),
    execute: vi.fn(() => Promise.resolve('verified-v3-token')),
  };
  const injector = createInjector([
    ...plainTheme.providers,
    {
      provide: WindowService,
      useValue: { nativeWindow: unavailable ? undefined : { grecaptcha: client } },
    },
    { provide: DocumentService, useValue: { nativeDocument: unavailable ? undefined : document } },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    setting: {
      values: {
        'Abp.Account.Captcha.UseCaptchaOnRegistration': String(enabled),
        'Abp.Account.Captcha.Version': version,
        'Abp.Account.Captcha.SiteKey': 'public-site-key',
      },
    },
  });
  const wrapper = mount(AccountCaptcha, {
    props: { action: 'register' },
    global: {
      provide: { [ABP_INJECTOR_KEY as symbol]: injector },
      mocks: { $t: (key: string) => key },
    },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, client, config, events: () => events };
}
describe('account CAPTCHA', () => {
  it('requires a completed v2 challenge and rejects expired tokens', async () => {
    const { wrapper, client, events } = await setup('2');
    await expect(wrapper.vm.getToken()).rejects.toMatchObject({ name: 'CaptchaUnavailableError' });
    events().callback('verified-v2-token');
    await expect(wrapper.vm.getToken()).resolves.toBe('verified-v2-token');
    events()['expired-callback']();
    await expect(wrapper.vm.getToken()).rejects.toMatchObject({ name: 'CaptchaUnavailableError' });
    events()['error-callback']();
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe('AbpUi::DefaultErrorMessage');
    wrapper.vm.reset();
    expect(client.reset).toHaveBeenCalledWith(7);
  });
  it('executes v3 for the requested action without rendering a v2 challenge', async () => {
    const { wrapper, client } = await setup('3');
    await expect(wrapper.vm.getToken()).resolves.toBe('verified-v3-token');
    expect(client.execute).toHaveBeenCalledWith('public-site-key', { action: 'register' });
    expect(client.render).not.toHaveBeenCalled();
  });
  it('resets the existing v2 widget when retrying a provider error', async () => {
    const { wrapper, client, events } = await setup('2');
    events()['error-callback']();
    await flushPromises();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(client.render).toHaveBeenCalledOnce();
    expect(client.reset).toHaveBeenCalledWith(7);
    events().callback('retried-v2-token');
    await expect(wrapper.vm.getToken()).resolves.toBe('retried-v2-token');
  });
  it('cannot bypass a required challenge when the provider is unavailable', async () => {
    const { wrapper } = await setup('3', true, true);
    await expect(wrapper.vm.getToken()).rejects.toMatchObject({ name: 'CaptchaUnavailableError' });
  });
  it('does not contact the provider when CAPTCHA is disabled', async () => {
    const { wrapper, client } = await setup('3', false);
    await expect(wrapper.vm.getToken()).resolves.toBeUndefined();
    expect(client.execute).not.toHaveBeenCalled();
    expect(wrapper.find('button').exists()).toBe(false);
  });
  it('initializes when refreshed configuration enables a required challenge', async () => {
    const { wrapper, client, config, events } = await setup('2', false);
    config.setState({
      ...config.snapshot(),
      setting: {
        values: {
          ...config.snapshot().setting.values,
          'Abp.Account.Captcha.UseCaptchaOnRegistration': 'true',
        },
      },
    });
    await flushPromises();
    expect(client.render).toHaveBeenCalledOnce();
    events().callback('enabled-v2-token');
    await expect(wrapper.vm.getToken()).resolves.toBe('enabled-v2-token');
  });
});
