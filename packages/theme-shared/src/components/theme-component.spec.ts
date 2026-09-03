import { ABP_INJECTOR_KEY, createInjector, provideAbp, type Injector } from '@lsw-abpvue/core';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { MissingThemeComponentError } from '../models/errors.js';
import { provideThemeComponents } from '../providers/theme-components.provider.js';
import { AbpButton } from './contract-components.js';
import { useThemeComponent } from './theme-component.js';

const ThemeButton = defineComponent({
  name: 'ThemeButton',
  props: { variant: { type: String, default: 'secondary' } },
  setup:
    (props, { slots }) =>
    () =>
      h('button', { class: props.variant }, slots.default?.()),
});

const OtherButton = defineComponent({
  name: 'OtherButton',
  setup:
    (_props, { slots }) =>
    () =>
      h('a', slots.default?.()),
});

const render = (injector: Injector) =>
  mount(AbpButton, {
    props: { variant: 'primary' },
    slots: { default: 'Save' },
    global: { provide: { [ABP_INJECTOR_KEY]: injector } },
  });

describe('a contract component', () => {
  it('renders what the theme registered, with the props and slots it was given', () => {
    const wrapper = render(createInjector([provideThemeComponents({ AbpButton: ThemeButton })]));

    expect(wrapper.find('button.primary').text()).toBe('Save');
  });

  it('takes the last registration for a key, so one component can be replaced alone', () => {
    const wrapper = render(
      createInjector([
        provideThemeComponents({ AbpButton: ThemeButton }),
        provideThemeComponents({ AbpButton: OtherButton }),
      ]),
    );

    expect(wrapper.find('a').exists()).toBe(true);
  });

  it('resolves against the injector of the component using it, not the application', () => {
    const Page = defineComponent({
      name: 'PageWithOwnButton',
      setup() {
        provideAbp([provideThemeComponents({ AbpButton: OtherButton })]);
        return () => h(AbpButton, null, { default: () => 'Save' });
      },
    });

    const wrapper = mount(Page, {
      global: {
        provide: {
          [ABP_INJECTOR_KEY]: createInjector([provideThemeComponents({ AbpButton: ThemeButton })]),
        },
      },
    });

    expect(wrapper.find('a').exists()).toBe(true);
  });

  it('names the missing key instead of rendering nothing', () => {
    expect(() => render(createInjector([]))).toThrow(MissingThemeComponentError);
    expect(() => render(createInjector([]))).toThrow(/AbpButton/);
  });
});

describe('useThemeComponent', () => {
  it('is usable on its own, for a caller rendering the implementation itself', () => {
    const Host = defineComponent({
      name: 'HostResolvingItself',
      setup() {
        const button = useThemeComponent('AbpButton');
        return () => h(button, null, { default: () => 'Save' });
      },
    });

    const wrapper = mount(Host, {
      global: {
        provide: {
          [ABP_INJECTOR_KEY]: createInjector([provideThemeComponents({ AbpButton: ThemeButton })]),
        },
      },
    });

    expect(wrapper.find('button').text()).toBe('Save');
  });
});
