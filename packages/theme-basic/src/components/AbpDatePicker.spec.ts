import { flushPromises, mount } from '@vue/test-utils';
import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type DateTimeFormatDto,
} from '@lsw-abpvue/core';
import type { AbpDatePickerProps } from '@lsw-abpvue/theme-shared';
import { afterEach, describe, expect, it } from 'vitest';
import AbpDatePicker from './AbpDatePicker.vue';

const mounted: ReturnType<typeof mount>[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

function render(props: AbpDatePickerProps, dateTimeFormat: DateTimeFormatDto = {}) {
  const injector = createInjector([]);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    localization: {
      ...state.localization,
      currentCulture: {
        ...state.localization.currentCulture,
        cultureName: 'en',
        dateTimeFormat,
      },
    },
  });
  const wrapper = mount(AbpDatePicker, {
    props,
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: {
        $t: (key: string | { defaultValue: string }) =>
          typeof key === 'string' ? key : key.defaultValue,
      },
    },
  });
  mounted.push(wrapper);
  return wrapper;
}

describe('AbpDatePicker', () => {
  it.each([
    ['date', '2026-10-02T00:00:00Z', '2026-10-02'],
    ['date', '2026-10-02T23:30:00-05:00', '2026-10-02'],
    ['date', '2026-10-02', '2026-10-02'],
    ['time', '2026-10-02T12:34:56Z', '12:34:56'],
    ['time', '12:34', '12:34:00'],
    ['datetime', '2026-10-02T12:34:56.1234567+08:00', '2026-10-02T12:34:56'],
    ['datetime', '2026-10-02T12:34', '2026-10-02T12:34'],
  ] as const)('displays a %s value received from the backend: %s', (type, modelValue, value) => {
    const wrapper = render({ type, modelValue });

    expect(wrapper.get('input').element.value).toBe(value);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('uses the date part of ISO limits', () => {
    const wrapper = render({ min: '2026-01-01T00:00:00Z', max: '2026-12-31T00:00:00Z' });

    expect(wrapper.get('input').attributes('min')).toBe('2026-01-01');
    expect(wrapper.get('input').attributes('max')).toBe('2026-12-31');
  });

  it('uses the culture date pattern rather than the browser default order', () => {
    const wrapper = render({ modelValue: '2026-10-02' }, { shortDatePattern: 'dd/MM/yyyy' });
    expect(
      wrapper
        .findAll('[role="spinbutton"]')
        .map(segment => Number(segment.attributes('aria-valuenow'))),
    ).toEqual([2, 10, 2026]);
  });
  it('formats segment widths and literals from the culture pattern', () => {
    const wrapper = render(
      { modelValue: '2026-01-02' },
      { shortDatePattern: "d/MM/yy 'AD'", dateSeparator: '-' },
    );
    expect(wrapper.get('.abp-date-picker__field').text()).toBe('2-01-26 AD');
  });
  it('formats a textual month without changing the submitted ISO value', () => {
    const wrapper = render(
      { modelValue: '2026-01-02', name: 'date' },
      { shortDatePattern: 'dd MMM yyyy' },
    );
    expect(wrapper.get('.abp-date-picker__field').text()).toBe('02 Jan 2026');
    expect(wrapper.get<HTMLInputElement>('input[name="date"]').element.value).toBe('2026-01-02');
  });

  it('does not clear or open a readonly value', async () => {
    const wrapper = render({ modelValue: '2026-10-02', readonly: true, clearable: true });
    for (const button of wrapper.findAll('button')) {
      expect(button.attributes('disabled')).toBeDefined();
      await button.trigger('click');
    }
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('retains the original precision and offset for a named form value until it is edited', () => {
    const original = '2026-10-02T12:34:56.1234567+08:00';
    const wrapper = render({ type: 'datetime', modelValue: original, name: 'published' });
    expect(wrapper.get<HTMLInputElement>('input[name="published"]').element.value).toBe(original);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
  it('opens a calendar with month navigation and closes it with Escape', async () => {
    const wrapper = render({ modelValue: '2026-10-02', ariaLabel: 'Published on' });
    await wrapper.get('button[aria-label="Published on"]').trigger('click');
    await flushPromises();
    const calendar = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(calendar).not.toBeNull();
    expect(calendar?.textContent).toContain('October 2026');
    expect(calendar?.querySelector('button[aria-label="Next month"]')).not.toBeNull();
    calendar?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flushPromises();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
