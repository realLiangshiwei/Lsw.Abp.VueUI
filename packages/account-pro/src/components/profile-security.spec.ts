import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { AccountService } from '@lsw-abpvue/account-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthenticatorAppTab from './AuthenticatorAppTab.vue';
import MySecurityLogsPage from './MySecurityLogsPage.vue';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});
function render(
  component: typeof AuthenticatorAppTab | typeof MySecurityLogsPage,
  service: object,
) {
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: AccountService, useValue: service },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { ...config.snapshot().currentUser, id: 'member', isAuthenticated: true },
  });
  const wrapper = mount(component, {
    global: { provide: { [ABP_INJECTOR_KEY]: injector }, mocks: { $t: (key: string) => key } },
  });
  wrappers.push(wrapper);
  return wrapper;
}
describe('profile security', () => {
  it('shows the authenticator setup key when none is registered', async () => {
    const wrapper = render(AuthenticatorAppTab, {
      hasAuthenticator: vi.fn(async () => false),
      getAuthenticatorInfo: vi.fn(async () => ({ key: 'EXAMPLE-KEY', uri: '' })),
    });
    await flushPromises();
    expect(wrapper.text()).toContain('EXAMPLE-KEY');
  });
  it('shows an error when authenticator status cannot be loaded', async () => {
    const wrapper = render(AuthenticatorAppTab, {
      hasAuthenticator: vi.fn(async () => {
        throw new TypeError('Unavailable');
      }),
    });
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });
  it('filters security logs by the submitted action and clears the filter', async () => {
    const getSecurityLogList = vi.fn(async () => ({ items: [], totalCount: 0 }));
    const wrapper = render(MySecurityLogsPage, { getSecurityLogList });
    await flushPromises();
    await wrapper.get('input[name="action"]').setValue('Login');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(getSecurityLogList).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'Login' }),
      expect.anything(),
    );
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'AbpUi::Clear')
      ?.trigger('click');
    await flushPromises();
    expect(wrapper.get<HTMLInputElement>('input[name="action"]').element.value).toBe('');
    expect(getSecurityLogList).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: undefined }),
      expect.anything(),
    );
  });
});
