import {
  ABP_INJECTOR_KEY,
  AuthService,
  ConfigStateService,
  createInjector,
  type ApplicationConfigurationDto,
} from '@lsw-abpvue/core';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import AbpCurrentUser from './AbpCurrentUser.vue';

async function render(authenticated = false, withAuthentication = true) {
  const navigateToLogin = vi.fn(async () => {});
  const injector = createInjector(
    withAuthentication
      ? [{ provide: AuthService, useValue: { navigateToLogin } as unknown as AuthService }]
      : [],
  );
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { isAuthenticated: authenticated, userName: authenticated ? 'admin' : undefined },
  } as ApplicationConfigurationDto);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<p>Home</p>' } }],
  });
  await router.push('/');
  await router.isReady();
  const wrapper = mount(AbpCurrentUser, {
    global: { plugins: [router], provide: { [ABP_INJECTOR_KEY]: injector } },
  });

  return { wrapper, navigateToLogin };
}

describe('AbpCurrentUser', () => {
  it('offers a login button to an anonymous visitor', async () => {
    const { wrapper, navigateToLogin } = await render();

    expect(wrapper.get('button').text()).toBe('Login');
    await wrapper.get('button').trigger('click');
    expect(navigateToLogin).toHaveBeenCalledOnce();
  });

  it('shows the user menu after authentication', async () => {
    const { wrapper } = await render(true);

    expect(wrapper.get('button').text()).toBe('admin');
    expect(wrapper.text()).not.toContain('Login');
  });

  it('renders without a login action when the standalone theme has no authentication provider', async () => {
    const { wrapper } = await render(false, false);

    expect(wrapper.find('button').exists()).toBe(false);
  });
});
