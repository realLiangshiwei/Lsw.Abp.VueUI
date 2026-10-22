// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { ABP_INJECTOR_KEY } from '../di/inject.js';
import { createInjector } from '../di/injector.js';
import { ReplaceableComponentsService } from '../services/replaceable-components.service.js';
import AbpReplaceable from './AbpReplaceable.vue';

const Replacement = defineComponent({
  name: 'ReplacementUsers',
  props: { title: { type: String, default: '' } },
  setup: props => () => h('p', `replaced ${props.title}`),
});

const render = (injector: ReturnType<typeof createInjector>) =>
  mount(AbpReplaceable, {
    props: { replaceableKey: 'Identity.UsersComponent', title: 'users' },
    slots: { default: '<p>the module default</p>' },
    global: { provide: { [ABP_INJECTOR_KEY]: injector } },
  });

describe('AbpReplaceable', () => {
  it('keeps replacement attributes from falling through onto fallback fragments', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const injector = createInjector([]);
    const wrapper = mount(AbpReplaceable, {
      props: { replaceableKey: 'Identity.OrganizationMembersComponent' },
      attrs: { selectedOrganizationUnit: { id: 'unit' }, onAdded: () => {} },
      slots: { default: '<p>Members</p><p>Roles</p>' },
      global: { provide: { [ABP_INJECTOR_KEY]: injector } },
    });
    expect(warning.mock.calls.some(call => String(call[0]).includes('Extraneous'))).toBe(false);
    wrapper.unmount();
    injector.destroy();
    warning.mockRestore();
  });
  it('renders the default content the module ships when nobody replaced it', () => {
    expect(render(createInjector([])).text()).toBe('the module default');
  });

  it('renders the registered replacement, props and all', async () => {
    const injector = createInjector([]);
    const wrapper = render(injector);

    injector.get(ReplaceableComponentsService).add({
      key: 'Identity.UsersComponent',
      component: Replacement,
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toBe('replaced users');
  });
});
