import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  LocalizationService,
} from '@lsw-abpvue/core';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ossLocalizationResources } from '../../../../e2e/fixtures/localization.js';
import AbpInput from './AbpInput.vue';

function render(ariaLabel?: string) {
  const injector = createInjector([]);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    localization: {
      ...state.localization,
      resources: ossLocalizationResources(),
    },
  });
  return {
    injector,
    wrapper: mount(AbpInput, {
      props: { type: 'password', revealable: true, ariaLabel },
      global: { provide: { [ABP_INJECTOR_KEY]: injector } },
    }),
  };
}

describe('AbpInput password visibility localization', () => {
  it('uses the existing field label and a pressed state without requiring commercial resources', async () => {
    const { wrapper, injector } = render('Current password');
    try {
      const toggle = wrapper.get('button');
      expect(toggle.attributes('aria-label')).toBe('Current password');
      expect(toggle.attributes('aria-pressed')).toBe('false');
      expect(toggle.attributes('aria-controls')).toBe(wrapper.get('input').attributes('id'));
      await toggle.trigger('click');
      expect(toggle.attributes('aria-label')).toBe('Current password');
      expect(toggle.attributes('aria-pressed')).toBe('true');
      expect(wrapper.get('input').attributes('type')).toBe('text');
    } finally {
      wrapper.unmount();
      injector.destroy();
    }
  });

  it('uses the official password resource when the caller supplies no field label', () => {
    const { wrapper, injector } = render();
    try {
      expect(wrapper.get('button').attributes('aria-label')).toBe(
        injector.get(LocalizationService).t('AbpAccount::Password'),
      );
    } finally {
      wrapper.unmount();
      injector.destroy();
    }
  });
});
