import { ABP_INJECTOR_KEY, createInjector } from '@lsw-abpvue/core';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AbpTabList from './AbpTabList.vue';

interface Group {
  name: string;
  text?: string | undefined;
  iconClass?: string | undefined;
  displayName?: string | undefined;
}

function render(items: Group[], selected = '', slots = {}): VueWrapper {
  return mount(AbpTabList, {
    props: { items, modelValue: selected, ariaLabel: 'Groups' },
    slots,
    global: { provide: { [ABP_INJECTOR_KEY]: createInjector([...plainTheme.providers]) } },
  });
}

describe('AbpTabList', () => {
  it('is a tab list, with one tab per item', () => {
    const wrapper = render([{ name: 'first' }, { name: 'second' }]);

    expect(wrapper.find('[role="tablist"]').attributes('aria-label')).toBe('Groups');
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(2);
  });

  it('labels a tab by its text, and by its name when it has none', () => {
    const wrapper = render([{ name: 'AbpUi::Save' }, { name: 'second', text: 'AbpUi::Cancel' }]);

    // No localization is loaded here, so a key resolves to its own last segment.
    expect(wrapper.findAll('[role="tab"]').map(tab => tab.text())).toEqual(['Save', 'Cancel']);
  });

  it('lets the caller render the label itself', () => {
    const wrapper = render([{ name: 'first', displayName: 'Identity' }], '', {
      label: '<template #default="{ item }">{{ item.displayName }} (3)</template>',
    });

    expect(wrapper.find('[role="tab"]').text()).toBe('Identity (3)');
  });

  it('marks the selected tab, and only that one is tabbable', () => {
    const wrapper = render([{ name: 'first' }, { name: 'second' }], 'second');
    const tabs = wrapper.findAll('[role="tab"]');

    expect(tabs.map(tab => tab.attributes('aria-selected'))).toEqual(['false', 'true']);
    expect(tabs.map(tab => tab.attributes('tabindex'))).toEqual(['-1', '0']);
  });

  it('asks for the tab that was clicked', async () => {
    const wrapper = render([{ name: 'first' }, { name: 'second' }], 'first');

    await wrapper.findAll('[role="tab"]')[1]?.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['second']);
  });

  it('selects tabs with arrow keys, Home and End', async () => {
    const wrapper = render([{ name: 'first' }, { name: 'second' }, { name: 'third' }], 'first');
    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['second']);
    await tabs[2]?.trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['first']);
    await tabs[0]?.trigger('keydown', { key: 'End' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['third']);
    await tabs[2]?.trigger('keydown', { key: 'Home' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['first']);
  });

  it('says which way it runs, for the theme and for a screen reader', () => {
    const vertical = render([{ name: 'first' }]);
    expect(vertical.find('[role="tablist"]').attributes('aria-orientation')).toBe('vertical');
    expect(vertical.find('[role="tablist"]').classes()).toContain('abp-tabs--vertical');

    const horizontal = mount(AbpTabList, {
      props: { items: [{ name: 'first' }], orientation: 'horizontal' as const },
      global: { provide: { [ABP_INJECTOR_KEY]: createInjector([...plainTheme.providers]) } },
    });
    expect(horizontal.find('[role="tablist"]').attributes('aria-orientation')).toBe('horizontal');
  });

  it('renders the icon a tab asks for, without announcing it', () => {
    const wrapper = render([{ name: 'first', iconClass: 'bi bi-key' }]);

    expect(wrapper.find('i.bi-key').attributes('aria-hidden')).toBe('true');
  });
});
