import {
  ABP_INJECTOR_KEY,
  AuthService,
  ConfigStateService,
  LocalizationService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import {
  IdentityLinkUserService,
  IdentityUserDelegationService,
  UserSharingService,
} from '@lsw-abpvue/account-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { computed, shallowRef } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountWorkflowsService } from '../services/account-workflows.service.js';
import AccountWorkflowsPage from './AccountWorkflowsPage.vue';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});

describe.each(['links', 'delegation', 'tenants'])('account %s', section => {
  async function setup(failed = false, authenticated = true) {
    const query = vi.fn(async () => {
      if (failed) throw new TypeError('Service unavailable');
      return { items: [] };
    });
    const login = vi.fn();
    const injector = createInjector([
      ...plainTheme.providers,
      {
        provide: AuthService,
        useValue: { isAuthenticated: computed(() => authenticated), navigateToLogin: login },
      },
      {
        provide: AccountWorkflowsService,
        useValue: {
          pendingHandoff: shallowRef(undefined),
          resumeHandoff: vi.fn(async () => undefined),
          cancelHandoff: vi.fn(),
        },
      },
      { provide: IdentityLinkUserService, useValue: { getAllList: query } },
      {
        provide: IdentityUserDelegationService,
        useValue: {
          getDelegatedUsers: query,
          getMyDelegatedUsers: query,
          getActiveDelegations: query,
        },
      },
      { provide: UserSharingService, useValue: { getAllList: query } },
    ]);
    injectors.push(injector);
    vi.spyOn(injector.get(LocalizationService), 't').mockImplementation(key => String(key));
    const config = injector.get(ConfigStateService);
    config.setState({
      ...config.snapshot(),
      currentUser: {
        ...config.snapshot().currentUser,
        id: 'member',
        userName: 'Example member',
        isAuthenticated: authenticated,
      },
      multiTenancy: { ...config.snapshot().multiTenancy, userSharingStrategy: 1 },
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: AccountWorkflowsPage }],
    });
    await router.push({ path: '/', query: { section } });
    const wrapper = mount(AccountWorkflowsPage, {
      global: { plugins: [router], provide: { [ABP_INJECTOR_KEY]: injector } },
    });
    wrappers.push(wrapper);
    await flushPromises();
    return { wrapper, query, config };
  }

  it('loads the selected section for the current user', async () => {
    const { wrapper, query } = await setup();
    expect(wrapper.text()).toContain('Example member');
    expect(query).toHaveBeenCalled();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('reports failed loading and allows retry', async () => {
    const { wrapper, query } = await setup(true);
    expect(wrapper.get('[role="alert"]').text()).toContain('AbpUi::ErrorLoadingDatatable');
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'AbpUi::Refresh')
      ?.trigger('click');
    await flushPromises();
    expect(query.mock.calls.length).toBeGreaterThan(1);
  });

  it('does not read private records before authentication', async () => {
    const { wrapper, query } = await setup(false, false);
    expect(query).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('AbpAccount::Login');
    expect(wrapper.text()).not.toContain('Example member');
  });
});
