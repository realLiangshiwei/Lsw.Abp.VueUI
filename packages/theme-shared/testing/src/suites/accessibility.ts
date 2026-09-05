import {
  AbpButton,
  AbpConfirmHost,
  AbpDatePicker,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpPagination,
  AbpSelect,
  AbpSpinner,
  AbpToastHost,
  AbpToggle,
  AbpTypeahead,
  ConfirmationService,
  ToasterService,
} from '@lsw-abpvue/theme-shared';
import { describe, it } from 'vitest';
import { expectAccessible, renderContract, type ThemeUnderTest } from '../harness.js';

const OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'editor', label: 'Editor' },
];

export function testAccessibility(theme: ThemeUnderTest): void {
  describe('accessibility', () => {
    it('AbpButton', async () => {
      const { wrapper } = renderContract(theme, AbpButton, { slots: { default: 'Save' } });
      await expectAccessible(wrapper.element);
    });

    it('AbpButton with only an icon', async () => {
      const { wrapper } = renderContract(theme, AbpButton, {
        props: { iconClass: 'bi bi-trash', ariaLabel: 'Delete' },
      });
      await expectAccessible(wrapper.element);
    });

    it('AbpSpinner', async () => {
      const { wrapper } = renderContract(theme, AbpSpinner, { props: { label: 'Loading' } });
      await expectAccessible(wrapper.element);
    });

    it('AbpFormField around an invalid control', async () => {
      const { wrapper } = renderContract(theme, AbpFormField, {
        props: { label: 'User name', required: true, errors: ['This field is required.'] },
        slots: {
          default: `<template #default="ctx"><input :id="ctx.id" :aria-describedby="ctx.describedBy" :aria-invalid="ctx.invalid || undefined" /></template>`,
        },
      });
      await expectAccessible(wrapper.element);
    });

    it('AbpInput', async () => {
      const { wrapper } = renderContract(theme, AbpInput, {
        props: { modelValue: 'admin', ariaLabel: 'User name' },
      });
      await expectAccessible(wrapper.element);
    });

    it('AbpToggle in each of its shapes', async () => {
      for (const props of [
        { variant: 'checkbox', modelValue: true, ariaLabel: 'Active' },
        { variant: 'switch', modelValue: true, ariaLabel: 'Active' },
        { variant: 'radio', modelValue: 'admin', options: OPTIONS, ariaLabel: 'Role' },
      ]) {
        const { wrapper } = renderContract(theme, AbpToggle, { props });
        await expectAccessible(wrapper.element);
      }
    });

    it('AbpSelect', async () => {
      const { wrapper } = renderContract(theme, AbpSelect, {
        props: { options: OPTIONS, modelValue: 'admin', ariaLabel: 'Role' },
      });
      await expectAccessible(wrapper.element);
    });

    it('AbpDatePicker', async () => {
      const { wrapper } = renderContract(theme, AbpDatePicker, {
        props: { modelValue: '2026-09-03', ariaLabel: 'Published' },
      });
      await expectAccessible(wrapper.element);
    });

    it('AbpTypeahead', async () => {
      const { wrapper } = renderContract(theme, AbpTypeahead, {
        props: { search: async () => [], ariaLabel: 'User' },
      });
      await expectAccessible(wrapper.element);
    });

    it('AbpPagination', async () => {
      const { wrapper } = renderContract(theme, AbpPagination, {
        props: { page: 1, pageSize: 10, total: 35, ariaLabel: 'Pages' },
      });
      await expectAccessible(wrapper.element);
    });

    it('AbpModal', async () => {
      const { wrapper } = renderContract(theme, AbpModal, {
        props: { visible: true },
        slots: { header: '<h2>Delete user</h2>', default: '<p>Are you sure?</p>' },
      });
      await expectAccessible(wrapper.element);
    });

    it('AbpToastHost', async () => {
      const { wrapper, injector } = renderContract(theme, AbpToastHost, {});
      injector.get(ToasterService).error('That did not work.');
      await wrapper.vm.$nextTick();

      await expectAccessible(wrapper.element);
    });

    it('AbpConfirmHost', async () => {
      const { wrapper, injector } = renderContract(theme, AbpConfirmHost, {});
      const confirmation = injector.get(ConfirmationService);
      void confirmation.warn('Delete this user?', 'Are you sure?');
      await wrapper.vm.$nextTick();

      await expectAccessible(wrapper.element);
      confirmation.clear();
    });
  });
}
