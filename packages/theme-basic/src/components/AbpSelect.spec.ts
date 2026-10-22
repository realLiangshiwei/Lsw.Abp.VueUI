import { ABP_INJECTOR_KEY, createInjector, type Injector } from '@lsw-abpvue/core';
import type { AbpSelectProps } from '@lsw-abpvue/theme-shared';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import AbpSelect from './AbpSelect.vue';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  for (const injector of injectors.splice(0)) injector.destroy();
  document.body.innerHTML = '';
});

function render(props: Partial<AbpSelectProps> = {}) {
  const injector = createInjector([]);
  const wrapper = mount(AbpSelect, {
    attachTo: document.body,
    props: {
      options: [
        { value: false, label: 'No' },
        { value: 0, label: 'Zero' },
        { value: 'reader', label: 'Reader' },
      ],
      placeholder: 'Choose an option',
      ...props,
    },
    global: { provide: { [ABP_INJECTOR_KEY]: injector } },
  });
  wrappers.push(wrapper);
  injectors.push(injector);
  return wrapper;
}

describe('AbpSelect', () => {
  it('announces an invalid selection and clears the state when corrected', async () => {
    const wrapper = render({ invalid: true, ariaDescribedby: 'selection-errors' });
    expect(wrapper.get('[role="combobox"]').attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('[role="combobox"]').attributes('aria-describedby')).toBe(
      'selection-errors',
    );
    await wrapper.setProps({ invalid: false });
    expect(wrapper.get('[role="combobox"]').attributes('aria-invalid')).toBeUndefined();
  });
  it.each([undefined, null])('displays the placeholder for an unset value: %s', modelValue => {
    const wrapper = render({ modelValue });
    expect(wrapper.get('[role="combobox"]').text()).toBe('Choose an option');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it.each([
    [false, 'No'],
    [0, 'Zero'],
  ] as const)('displays the selected label for a falsy value: %s', (modelValue, label) => {
    const wrapper = render({ modelValue });
    expect(wrapper.get('[role="combobox"]').text()).toBe(label);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('restores the placeholder when a selected value is cleared by the caller', async () => {
    const wrapper = render({ modelValue: 'reader' });
    expect(wrapper.get('[role="combobox"]').text()).toBe('Reader');
    await wrapper.setProps({ modelValue: null });
    expect(wrapper.get('[role="combobox"]').text()).toBe('Choose an option');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('displays the placeholder for an empty multiple selection', () => {
    const wrapper = render({ modelValue: [], multiple: true });
    expect(wrapper.get('[role="combobox"]').text()).toBe('Choose an option');
  });
});
