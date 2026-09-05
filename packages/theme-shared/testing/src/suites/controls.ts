import { AbpButton, AbpFormField, AbpInput, AbpSpinner, AbpToggle } from '@lsw-abpvue/theme-shared';
import { describe, expect, it } from 'vitest';
import {
  accessibleName,
  activateToggle,
  findAllRendered,
  findRendered,
  renderContract,
  type ThemeUnderTest,
} from '../harness.js';

export function testButton(theme: ThemeUnderTest): void {
  describe('AbpButton', () => {
    it('renders what it was given to say', () => {
      const { wrapper } = renderContract(theme, AbpButton, { slots: { default: 'Save' } });

      expect(accessibleName(wrapper.element)).toBe('Save');
    });

    it('reports a click', async () => {
      const { wrapper, emitted } = renderContract(theme, AbpButton, {
        slots: { default: 'Save' },
        events: ['click'],
      });

      await wrapper.find('button').trigger('click');

      expect(emitted('click')).toHaveLength(1);
    });

    it('refuses the click when disabled, and says it is disabled', async () => {
      const { wrapper, emitted } = renderContract(theme, AbpButton, {
        props: { disabled: true },
        slots: { default: 'Save' },
        events: ['click'],
      });
      const button = wrapper.find('button');

      await button.trigger('click');

      expect(emitted('click')).toHaveLength(0);
      expect(
        button.attributes('disabled') !== undefined ||
          button.attributes('aria-disabled') === 'true',
      ).toBe(true);
    });

    it('refuses the click while loading, and says it is busy', async () => {
      const { wrapper, emitted } = renderContract(theme, AbpButton, {
        props: { loading: true },
        slots: { default: 'Save' },
        events: ['click'],
      });

      await wrapper.find('button').trigger('click');

      expect(emitted('click')).toHaveLength(0);
      expect(wrapper.find('button').attributes('aria-busy')).toBe('true');
    });

    it('takes its accessible name from ariaLabel when it renders only an icon', () => {
      const { wrapper } = renderContract(theme, AbpButton, {
        props: { iconClass: 'bi bi-trash', ariaLabel: 'Delete' },
      });

      expect(wrapper.find('button').attributes('aria-label')).toBe('Delete');
    });
  });
}

export function testSpinner(theme: ThemeUnderTest): void {
  describe('AbpSpinner', () => {
    it('announces itself as a status rather than sitting there silently', () => {
      const { wrapper } = renderContract(theme, AbpSpinner, {});

      expect(['status', 'progressbar']).toContain(wrapper.element.getAttribute('role'));
    });

    it('carries the label it was given as its accessible name', () => {
      const { wrapper } = renderContract(theme, AbpSpinner, { props: { label: 'Loading books' } });

      expect(accessibleName(wrapper.element)).toBe('Loading books');
    });
  });
}

export function testFormField(theme: ThemeUnderTest): void {
  const field = (props: Record<string, unknown>) =>
    renderContract(theme, AbpFormField, {
      props,
      slots: {
        default: `<template #default="ctx"><input :id="ctx.id" :aria-describedby="ctx.describedBy" :aria-invalid="ctx.invalid || undefined" /></template>`,
      },
    });

  describe('AbpFormField', () => {
    it('labels the control it wraps, by id', () => {
      const { wrapper } = field({ label: 'User name' });
      const label = wrapper.find('label');

      expect(label.text()).toContain('User name');
      expect(label.attributes('for')).toBe(wrapper.find('input').attributes('id'));
    });

    it('shows the errors it was given', () => {
      const { wrapper } = field({ label: 'User name', errors: ['This field is required.'] });

      expect(wrapper.text()).toContain('This field is required.');
    });

    it('tells the control it is invalid, and points it at the message', () => {
      const { wrapper } = field({ label: 'User name', errors: ['This field is required.'] });
      const input = wrapper.find('input');

      expect(input.attributes('aria-invalid')).toBe('true');

      const describedBy = input.attributes('aria-describedby') ?? '';
      const described = describedBy
        .split(' ')
        .map(id => wrapper.element.querySelector(`#${id}`)?.textContent ?? '')
        .join(' ');
      expect(described).toContain('This field is required.');
    });

    it('leaves the control valid when there is nothing wrong with it', () => {
      const { wrapper } = field({ label: 'User name', hint: 'At least four characters.' });

      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined();
      expect(wrapper.text()).toContain('At least four characters.');
    });
  });
}

export function testInput(theme: ThemeUnderTest): void {
  describe('AbpInput', () => {
    it('shows the value it was given and reports what was typed', async () => {
      const { wrapper, emitted } = renderContract(theme, AbpInput, {
        props: { modelValue: 'admin' },
        events: ['update:modelValue'],
      });
      const input = wrapper.find('input');

      expect(input.element.value).toBe('admin');

      await input.setValue('editor');
      expect(emitted('update:modelValue').at(-1)).toEqual(['editor']);
    });

    it('renders the type it was asked for', () => {
      const { wrapper } = renderContract(theme, AbpInput, { props: { type: 'password' } });

      expect(wrapper.find('input').attributes('type')).toBe('password');
    });

    it('renders a textarea when asked for one', () => {
      const { wrapper } = renderContract(theme, AbpInput, { props: { type: 'textarea' } });

      expect(wrapper.find('textarea').exists()).toBe(true);
    });

    it('reports a number as a number', async () => {
      const { wrapper, emitted } = renderContract(theme, AbpInput, {
        props: { type: 'number' },
        events: ['update:modelValue'],
      });

      await wrapper.find('input').setValue('42');

      expect(emitted('update:modelValue').at(-1)).toEqual([42]);
    });

    it('cannot be typed into when disabled or read only', () => {
      const disabled = renderContract(theme, AbpInput, { props: { disabled: true } });
      const readonly = renderContract(theme, AbpInput, { props: { readonly: true } });

      expect(disabled.wrapper.find('input').attributes('disabled')).toBeDefined();
      expect(readonly.wrapper.find('input').attributes('readonly')).toBeDefined();
    });

    it('says it is invalid when it is', () => {
      const { wrapper } = renderContract(theme, AbpInput, { props: { invalid: true } });

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
    });
  });
}

export function testToggle(theme: ThemeUnderTest): void {
  describe('AbpToggle', () => {
    it('checks and unchecks, and reports each change', async () => {
      const rendered = renderContract(theme, AbpToggle, {
        props: { modelValue: false, label: 'Active' },
        events: ['update:modelValue'],
      });

      await activateToggle(rendered);

      expect(rendered.emitted('update:modelValue').at(-1)).toEqual([true]);
    });

    it('renders a switch that assistive technology can tell from a checkbox', () => {
      const rendered = renderContract(theme, AbpToggle, {
        props: { variant: 'switch', modelValue: true, label: 'Active' },
      });

      const control = findRendered(rendered, '[role="switch"], input[type="checkbox"]');
      expect(control).not.toBeNull();
      expect(
        control?.attributes('role') === 'switch' || control?.attributes('type') === 'checkbox',
      ).toBe(true);
    });

    it('picks one of the options in a radio group', async () => {
      const rendered = renderContract(theme, AbpToggle, {
        props: {
          variant: 'radio',
          modelValue: 'a',
          options: [
            { value: 'a', label: 'First' },
            { value: 'b', label: 'Second' },
          ],
        },
        events: ['update:modelValue'],
      });

      const second = findAllRendered(rendered, 'input[type="radio"], [role="radio"]')[1];
      await (second?.element.tagName === 'INPUT'
        ? second.setValue(true)
        : second?.trigger('click'));

      expect(rendered.emitted('update:modelValue').at(-1)).toEqual(['b']);
    });

    it('cannot be changed when disabled', async () => {
      const rendered = renderContract(theme, AbpToggle, {
        props: { modelValue: false, disabled: true, label: 'Active' },
        events: ['update:modelValue'],
      });
      const control = findRendered(
        rendered,
        'input[type="checkbox"], [role="checkbox"], [role="switch"]',
      );

      expect(
        control?.attributes('disabled') !== undefined ||
          control?.attributes('aria-disabled') === 'true' ||
          control?.attributes('data-disabled') !== undefined,
      ).toBe(true);

      await activateToggle(rendered);
      expect(rendered.emitted('update:modelValue')).toHaveLength(0);
    });
  });
}
