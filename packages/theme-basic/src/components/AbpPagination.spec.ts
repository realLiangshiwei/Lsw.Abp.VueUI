import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  LocalizationService,
} from '@lsw-abpvue/core';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ossLocalizationResources } from '../../../../e2e/fixtures/localization.js';
import AbpPagination from './AbpPagination.vue';

describe('AbpPagination localization', () => {
  it('names its size selector with the official backend entry-count template', async () => {
    const injector = createInjector([]);
    const config = injector.get(ConfigStateService);
    const state = config.snapshot();
    config.setState({
      ...state,
      localization: { ...state.localization, resources: ossLocalizationResources() },
    });
    const wrapper = mount(AbpPagination, {
      props: { page: 0, pageSize: 10, total: 50, showSizeSelector: true, ariaLabel: 'Books' },
      global: {
        provide: { [ABP_INJECTOR_KEY]: injector },
        mocks: { $t: (key: string) => injector.get(LocalizationService).t(key) },
      },
    });
    try {
      expect(wrapper.get('select').attributes('aria-label')).toBe('Show 10 entries');
      await wrapper.setProps({ pageSize: 25 });
      expect(wrapper.get('select').attributes('aria-label')).toBe('Show 25 entries');
      expect(wrapper.get('nav').attributes('aria-label')).toBe('Books');
      const second = wrapper.findAll('button').find(button => button.text() === '2');
      expect(second?.attributes('aria-label')).toBe('2');
      expect(
        wrapper.findAll('[aria-label]').map(item => item.attributes('aria-label')),
      ).not.toEqual(expect.arrayContaining([expect.stringMatching(/^Page /)]));
    } finally {
      wrapper.unmount();
      injector.destroy();
    }
  });
});
