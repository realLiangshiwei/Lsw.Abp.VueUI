// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ABP_INJECTOR_KEY } from '../di/inject';
import { createInjector, type Injector } from '../di/injector';
import type { ApplicationConfigurationDto } from '../proxy/models';
import { ConfigStateService } from '../services/config-state.service';
import AbpPermission from './AbpPermission.vue';

function withPolicies(policies: Record<string, boolean>): Injector {
  const injector = createInjector([]);
  const configState = injector.get(ConfigStateService);
  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: policies },
  } as ApplicationConfigurationDto);

  return injector;
}

const render = (injector: Injector, policy?: string) =>
  mount(AbpPermission, {
    props: policy === undefined ? {} : { policy },
    slots: { default: '<button>New user</button>' },
    global: { provide: { [ABP_INJECTOR_KEY]: injector } },
  });

describe('AbpPermission', () => {
  it('renders the slot when the policy is granted', () => {
    const wrapper = render(
      withPolicies({ 'AbpIdentity.Users.Create': true }),
      'AbpIdentity.Users.Create',
    );

    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('renders nothing when the policy is not granted', () => {
    const wrapper = render(withPolicies({}), 'AbpIdentity.Users.Create');

    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.text()).toBe('');
  });

  it('renders as usual with no policy', () => {
    expect(render(withPolicies({})).find('button').exists()).toBe(true);
  });

  it('nothing is remounted after a login: the content appears as the permission changes', async () => {
    const injector = withPolicies({});
    const wrapper = render(injector, 'AbpIdentity.Users.Create');
    const configState = injector.get(ConfigStateService);

    configState.setState({
      ...configState.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users.Create': true } },
    } as ApplicationConfigurationDto);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('button').exists()).toBe(true);
  });
});
