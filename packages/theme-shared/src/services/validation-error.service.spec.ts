import { ABP_INJECTOR_KEY, createInjector } from '@lsw-abpvue/core';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useServerValidation, ValidationErrorService } from './validation-error.service.js';

describe('useServerValidation', () => {
  it('registers the form for as long as the component is mounted', () => {
    const injector = createInjector([]);
    const validation = injector.get(ValidationErrorService);
    const form = { setServerErrors: vi.fn() };

    const wrapper = mount(
      defineComponent({
        name: 'FormPage',
        setup() {
          useServerValidation(form);
          return () => h('form');
        },
      }),
      { global: { provide: { [ABP_INJECTOR_KEY]: injector } } },
    );

    expect(validation.hasTarget).toBe(true);

    wrapper.unmount();
    expect(validation.hasTarget).toBe(false);
  });
});
