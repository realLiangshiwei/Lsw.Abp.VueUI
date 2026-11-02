import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  LocalizationService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import {
  IdentityClaimTypeService,
  IdentityRoleService,
  OrganizationUnitService,
} from '@lsw-abpvue/identity-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { provideIdentityPro } from '../providers/identity-pro.provider.js';
import { identityProExtensionsResolver } from '../resolvers/extensions.resolver.js';
import { IdentityProPolicyNames } from '@lsw-abpvue/identity-pro/config';
import ClaimsPage from './ClaimsPage.vue';
import RolesPage from './RolesPage.vue';
import OrganizationUnitsPage from './OrganizationUnitsPage.vue';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});

describe.each([
  {
    component: ClaimsPage,
    name: 'claims',
    policy: 'AbpIdentity.ClaimTypes',
    token: IdentityClaimTypeService,
    title: 'AbpIdentity::ClaimTypes',
  },
  {
    component: RolesPage,
    name: 'roles',
    policy: 'AbpIdentity.Roles',
    token: IdentityRoleService,
    title: 'AbpIdentity::Roles',
  },
  {
    component: OrganizationUnitsPage,
    name: 'organization units',
    policy: 'AbpIdentity.OrganizationUnits',
    token: OrganizationUnitService,
    title: 'AbpIdentity::OrganizationUnits',
  },
])('$name administration', ({ component, policy, token, title }) => {
  async function setup(granted = true, failed = false, writable = false) {
    const record = {
      id: 'record',
      name: 'Example record',
      displayName: 'Example record',
      code: '00001',
      userCount: 0,
      valueType: 0,
      concurrencyStamp: 'stamp',
    };
    const get = vi.fn(async () => record);
    const query = vi.fn(async () => {
      if (failed) throw new TypeError('Service unavailable');
      return { items: [record], totalCount: 1 };
    });
    const injector = createInjector([
      ...plainTheme.providers,
      ...provideIdentityPro(),
      { provide: token, useValue: { getList: query, getListAll: query, get } },
    ]);
    injectors.push(injector);
    vi.spyOn(injector.get(LocalizationService), 't').mockImplementation(key => String(key));
    const config = injector.get(ConfigStateService);
    config.setState({
      ...config.snapshot(),
      currentUser: { ...config.snapshot().currentUser, id: 'member', isAuthenticated: true },
      auth: {
        grantedPolicies: writable
          ? Object.fromEntries(Object.values(IdentityProPolicyNames).map(policy => [policy, true]))
          : granted
            ? { [policy]: true }
            : {},
      },
    });
    injector.runInContext(identityProExtensionsResolver);
    const wrapper = mount(component, {
      global: { provide: { [ABP_INJECTOR_KEY]: injector }, mocks: { $t: (key: string) => key } },
    });
    wrappers.push(wrapper);
    await flushPromises();
    return { wrapper, query, config, get };
  }

  it('renders the page without offering unauthorized writes', async () => {
    const { wrapper, query } = await setup();
    expect(wrapper.text()).toContain(title);
    expect(query).toHaveBeenCalled();
    expect(wrapper.findAll('button').some(button => button.text().includes('AbpUi::Delete'))).toBe(
      false,
    );
  });

  it('reads the current record before opening its editor', async () => {
    const { wrapper, get } = await setup(true, false, true);
    const edit = wrapper
      .findAll('button')
      .find(
        button =>
          button.text().includes('AbpUi::Edit') ||
          button.attributes('aria-label')?.includes('AbpUi::Edit'),
      );
    expect(edit).toBeDefined();
    await edit?.trigger('click');
    await flushPromises();
    expect(get).toHaveBeenCalled();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.find('input[name="name"], input[name="displayName"]').exists()).toBe(true);
  });

  it('hides write controls without permission', async () => {
    const { wrapper } = await setup(false);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('offers a retry when loading fails', async () => {
    const { wrapper, query } = await setup(true, true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    const retry = wrapper
      .findAll('button')
      .find(button => button.text().includes('AbpUi::Refresh'));
    expect(retry).toBeDefined();
    await retry?.trigger('click');
    await flushPromises();
    expect(query.mock.calls.length).toBeGreaterThan(1);
  });
});
