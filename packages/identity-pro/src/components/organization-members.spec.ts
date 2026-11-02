import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  LocalizationService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { IdentityProPolicyNames } from '@lsw-abpvue/identity-pro/config';
import { OrganizationUnitService } from '@lsw-abpvue/identity-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OrganizationAssignments from './OrganizationAssignments.vue';
const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});
describe.each(['members', 'roles'] as const)('organization %s', kind => {
  async function setup(failed = false) {
    const query = vi.fn(async () => {
      if (failed) throw new TypeError('Unavailable');
      return { items: [], totalCount: 0 };
    });
    const candidates = vi.fn(async () => ({ items: [], totalCount: 0 }));
    const injector = createInjector([
      ...plainTheme.providers,
      {
        provide: OrganizationUnitService,
        useValue: {
          getMembers: query,
          getRoles: query,
          getAvailableUsers: candidates,
          getAvailableRoles: candidates,
        },
      },
    ]);
    injectors.push(injector);
    vi.spyOn(injector.get(LocalizationService), 't').mockImplementation(key => String(key));
    const config = injector.get(ConfigStateService);
    config.setState({
      ...config.snapshot(),
      currentUser: { ...config.snapshot().currentUser, id: 'member', isAuthenticated: true },
      auth: {
        grantedPolicies: Object.fromEntries(
          Object.values(IdentityProPolicyNames).map(policy => [policy, true]),
        ),
      },
    });
    const wrapper = mount(OrganizationAssignments, {
      props: {
        kind,
        selectedOrganizationUnit: {
          id: 'unit',
          displayName: 'Example unit',
          code: '00001',
          userCount: 0,
        },
      },
      global: { provide: { [ABP_INJECTOR_KEY]: injector }, mocks: { $t: (key: string) => key } },
    });
    wrappers.push(wrapper);
    await flushPromises();
    return { wrapper, query, candidates, config };
  }
  it('loads assignments and opens the candidate picker', async () => {
    const { wrapper, query, candidates } = await setup();
    expect(wrapper.text()).toContain('Example unit');
    expect(query).toHaveBeenCalled();
    await wrapper
      .findAll('button')
      .find(button => button.text().includes(kind === 'members' ? 'AddMember' : 'AddRole'))
      ?.trigger('click');
    await flushPromises();
    expect(candidates).toHaveBeenCalled();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
  });
  it('reports failed assignment loading', async () => {
    const { wrapper } = await setup(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });
  it('removes write controls after permission revocation', async () => {
    const { wrapper, config } = await setup();
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    await flushPromises();
    expect(
      wrapper
        .findAll('button')
        .some(button => button.text().includes(kind === 'members' ? 'AddMember' : 'AddRole')),
    ).toBe(false);
  });
});
