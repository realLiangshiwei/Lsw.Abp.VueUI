// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { ABP_INJECTOR_KEY } from '../di/inject';
import { createInjector } from '../di/injector';
import { ReplaceableComponentsService } from '../services/replaceable-components.service';
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
