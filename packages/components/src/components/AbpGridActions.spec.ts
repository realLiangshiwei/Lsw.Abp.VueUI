import { ABP_INJECTOR_KEY, createInjector } from '@lsw-abpvue/core';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { RowAction } from '../models/actions.js';
import AbpGridActions from './AbpGridActions.vue';

const record = { id: '1', name: 'Book' };

function render(actions: RowAction<typeof record>[], disabled = false) {
  return mount(AbpGridActions, {
    props: { record, actions, disabled } as never,
    global: {
      provide: { [ABP_INJECTOR_KEY]: createInjector(plainTheme.providers) },
      mocks: { $t: (key: string) => key },
    },
  });
}

describe('explicit row actions', () => {
  it('renders several actions as a menu without module contributors', () => {
    const wrapper = render([
      { text: 'Edit', action: vi.fn() },
      { text: 'Delete', action: vi.fn() },
    ]);
    expect(wrapper.get('summary').text()).toBe('AbpUi::Actions');
    expect(wrapper.findAll('button').map(button => button.text())).toEqual(['Edit', 'Delete']);
    wrapper.unmount();
  });

  it('renders a single action as a button and passes the row directly', async () => {
    const action = vi.fn();
    const wrapper = render([{ text: 'Edit', action }]);
    expect(wrapper.find('summary').exists()).toBe(false);
    await wrapper.get('button').trigger('click');
    expect(action).toHaveBeenCalledWith(record);
    wrapper.unmount();
  });

  it('updates the display when the available actions change', async () => {
    const edit = { text: 'Edit', action: vi.fn() };
    const wrapper = render([edit, { text: 'Delete', action: vi.fn() }]);
    await wrapper.setProps({ actions: [edit] } as never);
    expect(wrapper.find('summary').exists()).toBe(false);
    expect(wrapper.get('button').text()).toBe('Edit');
    await wrapper.setProps({ actions: [] } as never);
    expect(wrapper.find('button').exists()).toBe(false);
    wrapper.unmount();
  });

  it('prevents actions while the page is busy', async () => {
    const action = vi.fn();
    const wrapper = render([{ text: 'Edit', action }], true);
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    await wrapper.get('button').trigger('click');
    expect(action).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('disables the menu trigger and every item while the page is busy', async () => {
    const action = vi.fn();
    const wrapper = render(
      [
        { text: 'Edit', action },
        { text: 'Delete', action },
      ],
      true,
    );
    expect(wrapper.get('summary').attributes('aria-disabled')).toBe('true');
    for (const button of wrapper.findAll('button')) {
      expect(button.attributes('disabled')).toBeDefined();
      await button.trigger('click');
    }
    expect(action).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
