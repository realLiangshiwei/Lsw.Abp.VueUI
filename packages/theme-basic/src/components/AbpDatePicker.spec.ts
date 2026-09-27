import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AbpDatePicker from './AbpDatePicker.vue';

describe('AbpDatePicker', () => {
  it.each([
    ['date', '2026-10-02T00:00:00Z', '2026-10-02'],
    ['date', '2026-10-02T23:30:00-05:00', '2026-10-02'],
    ['date', '2026-10-02', '2026-10-02'],
    ['time', '2026-10-02T12:34:56Z', '12:34:56'],
    ['time', '12:34', '12:34'],
    ['datetime', '2026-10-02T12:34:56.1234567+08:00', '2026-10-02T12:34:56.123'],
    ['datetime', '2026-10-02T12:34', '2026-10-02T12:34'],
  ] as const)('displays a %s value received from the backend: %s', (type, modelValue, value) => {
    const wrapper = mount(AbpDatePicker, { props: { type, modelValue } });

    expect(wrapper.get('input').element.value).toBe(value);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('uses the date part of ISO limits', () => {
    const wrapper = mount(AbpDatePicker, {
      props: { min: '2026-01-01T00:00:00Z', max: '2026-12-31T00:00:00Z' },
    });

    expect(wrapper.get('input').attributes('min')).toBe('2026-01-01');
    expect(wrapper.get('input').attributes('max')).toBe('2026-12-31');
  });
});
