import { AbpDatePicker, AbpSelect, AbpTypeahead } from '@lsw-abpvue/theme-shared';
import { describe, expect, it, vi } from 'vitest';
import { chooseOption, renderContract, type ThemeUnderTest } from '../harness.js';

const OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'editor', label: 'Editor' },
];

export function testSelect(theme: ThemeUnderTest): void {
  const select = (props: Record<string, unknown> = {}) =>
    renderContract(theme, AbpSelect, {
      props: { options: OPTIONS, ariaLabel: 'Role', ...props },
      events: ['update:modelValue'],
    });

  describe('AbpSelect', () => {
    it('shows the label of what is selected', () => {
      const { wrapper } = select({ modelValue: 'editor' });

      expect(wrapper.text()).toContain('Editor');
    });

    it('reports the value of the option that was picked', async () => {
      const rendered = select({ modelValue: 'admin' });

      await chooseOption(theme, rendered, { label: 'Editor', value: 'editor' });

      expect(rendered.emitted('update:modelValue').at(-1)).toEqual(['editor']);
    });

    it('reports every value when it takes more than one', async () => {
      const rendered = select({ multiple: true, modelValue: [] });

      await chooseOption(theme, rendered, { label: 'Editor', value: 'editor' });

      expect(rendered.emitted('update:modelValue').at(-1)?.[0]).toEqual(['editor']);
    });

    it('has an accessible name', () => {
      const { wrapper } = select();
      const control = wrapper.find('select, [role="combobox"], [role="listbox"]');

      expect(control.attributes('aria-label')).toBe('Role');
    });

    it('cannot be changed when disabled', async () => {
      const rendered = select({ disabled: true });
      const control = rendered.wrapper.find('select, [role="combobox"], [aria-expanded]');

      expect(
        control.attributes('disabled') !== undefined ||
          control.attributes('aria-disabled') === 'true',
      ).toBe(true);

      await control.trigger('click');
      expect(rendered.emitted('update:modelValue')).toHaveLength(0);
    });
  });
}

export function testDatePicker(theme: ThemeUnderTest): void {
  const picker = (props: Record<string, unknown> = {}) =>
    renderContract(theme, AbpDatePicker, {
      props: { ariaLabel: 'Published', ...props },
      events: ['update:modelValue'],
    });

  describe('AbpDatePicker', () => {
    it('shows the value it was given', () => {
      const { wrapper } = picker({ modelValue: '2026-09-03' });

      expect(wrapper.find('input').element.value).toBe('2026-09-03');
    });

    it('reports what was picked, still as a string', async () => {
      const { wrapper, emitted } = picker({ modelValue: '2026-09-03' });

      await wrapper.find('input').setValue('2026-10-01');

      expect(emitted('update:modelValue').at(-1)).toEqual(['2026-10-01']);
    });

    it('reports null rather than an empty string when it is cleared', async () => {
      const { wrapper, emitted } = picker({ modelValue: '2026-09-03', clearable: true });

      const clear = wrapper.findAll('button').at(-1);
      if (clear) await clear.trigger('click');
      else await wrapper.find('input').setValue('');

      expect(emitted('update:modelValue').at(-1)).toEqual([null]);
    });

    it('cannot be changed when disabled', () => {
      const { wrapper } = picker({ disabled: true });

      expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    });
  });
}

export function testTypeahead(theme: ThemeUnderTest): void {
  const typeahead = (search: (term: string, signal: AbortSignal) => Promise<unknown>) =>
    renderContract(theme, AbpTypeahead, {
      props: { search, debounce: 10, minLength: 2, ariaLabel: 'User' },
      events: ['update:modelValue', 'update:displayValue', 'select'],
    });

  const found = vi.fn(async () => [
    { value: '1', label: 'Alice' },
    { value: '2', label: 'Bob' },
  ]);

  describe('AbpTypeahead', () => {
    it('does not go to the backend for a term that is too short', async () => {
      const search = vi.fn(found);
      const { wrapper } = typeahead(search);

      await wrapper.find('input').setValue('a');
      await vi.waitFor(() => expect(search).not.toHaveBeenCalled());
    });

    it('searches once the typing has stopped, and shows what came back', async () => {
      const search = vi.fn(found);
      const { wrapper } = typeahead(search);

      await wrapper.find('input').setValue('al');

      await vi.waitFor(() => expect(wrapper.text()).toContain('Alice'));
      expect(search).toHaveBeenCalledTimes(1);
    });

    it('reports the value, the text and the item that was chosen', async () => {
      const { wrapper, emitted } = typeahead(vi.fn(found));

      await wrapper.find('input').setValue('al');
      await vi.waitFor(() => expect(wrapper.text()).toContain('Alice'));

      const option = wrapper.findAll('[role="option"]').find(item => item.text() === 'Alice');
      await option?.trigger('click');

      expect(emitted('update:modelValue').at(-1)).toEqual(['1']);
      expect(emitted('update:displayValue').at(-1)).toEqual(['Alice']);
      expect(emitted('select').at(-1)).toEqual([{ value: '1', label: 'Alice' }]);
    });

    it('abandons a search the user has already typed past', async () => {
      const signals: AbortSignal[] = [];
      const slow = vi.fn(async (_term: string, signal: AbortSignal) => {
        signals.push(signal);
        await new Promise(resolve => setTimeout(resolve, 20));
        return [{ value: '1', label: 'Alice' }];
      });
      const { wrapper } = typeahead(slow);

      await wrapper.find('input').setValue('al');
      await vi.waitFor(() => expect(signals).toHaveLength(1));
      await wrapper.find('input').setValue('ali');

      await vi.waitFor(() => expect(signals[0]?.aborted).toBe(true));
    });

    it('starts out showing the text it was given for the current value', () => {
      const { wrapper } = renderContract(theme, AbpTypeahead, {
        props: { search: found, modelValue: '1', displayValue: 'Alice' },
      });

      expect(wrapper.find('input').element.value).toBe('Alice');
    });
  });
}
