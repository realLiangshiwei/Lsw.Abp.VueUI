import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  LocalizationService,
  type Injector,
} from '@lsw-abpvue/core';
import {
  AbpPagination,
  AbpSpinner,
  ConfirmationService,
  ConfirmationStatus,
  ToasterService,
} from '@lsw-abpvue/theme-shared';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import type { Component } from 'vue';
import { ossLocalizationResources } from '../../../../e2e/fixtures/localization.js';
import { PlainConfirmHost, PlainDatePicker, PlainToastHost } from './plain-overlays.js';
import { plainTheme } from './plain-theme.js';

const mounted: VueWrapper[] = [];
const injectors: Injector[] = [];

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
  document.body.innerHTML = '';
});

function render(
  culture: 'en',
  component: unknown = PlainConfirmHost,
  props: Record<string, unknown> = {},
) {
  const injector = createInjector([...plainTheme.providers]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    localization: {
      ...state.localization,
      currentCulture: { ...state.localization.currentCulture, cultureName: culture },
      resources: ossLocalizationResources(),
    },
  });
  const wrapper = mount(component as Component, {
    props,
    attachTo: document.body,
    global: { provide: { [ABP_INJECTOR_KEY]: injector } },
  });
  mounted.push(wrapper);
  return {
    wrapper,
    confirmation: injector.get(ConfirmationService),
    localization: injector.get(LocalizationService),
    toaster: injector.get(ToasterService),
  };
}

describe.each(['en'] as const)('PlainConfirmHost %s resource graph', culture => {
  it('reads default buttons from official resources and preserves confirmation and rejection', async () => {
    const { wrapper, confirmation, localization } = render(culture);
    for (const key of ['Yes', 'Cancel'])
      expect(localization.findKey(['AbpUi'], [key])).toBe(`AbpUi::${key}`);

    const rejected = confirmation.warn('AbpUi::AreYouSure');
    await flushPromises();
    expect(wrapper.findAll('button').map(button => button.text())).toEqual([
      localization.t('AbpUi::Yes'),
      localization.t('AbpUi::Cancel'),
    ]);
    await wrapper.findAll('button')[1]?.trigger('click');
    await expect(rejected).resolves.toBe(ConfirmationStatus.reject);
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);

    const confirmed = confirmation.warn('AbpUi::AreYouSure');
    await flushPromises();
    await wrapper.findAll('button')[0]?.trigger('click');
    await expect(confirmed).resolves.toBe(ConfirmationStatus.confirm);
  });

  it('preserves host-provided localized button overrides', async () => {
    const { wrapper, confirmation, localization } = render(culture);
    const options = { yesText: 'AbpUi::Apply', cancelText: 'AbpUi::Back' };
    const rejected = confirmation.warn('AbpUi::AreYouSure', undefined, options);
    await flushPromises();
    expect(wrapper.findAll('button').map(button => button.text())).toEqual([
      localization.t(options.yesText),
      localization.t(options.cancelText),
    ]);
    await wrapper.findAll('button')[1]?.trigger('click');
    await expect(rejected).resolves.toBe(ConfirmationStatus.reject);

    const confirmed = confirmation.warn('AbpUi::AreYouSure', undefined, options);
    await flushPromises();
    await wrapper.findAll('button')[0]?.trigger('click');
    await expect(confirmed).resolves.toBe(ConfirmationStatus.confirm);
  });

  it('preserves already-localized button text supplied by the host', async () => {
    const { wrapper, confirmation } = render(culture);
    const options = { yesText: 'Host confirmation action', cancelText: 'Host keep editing action' };
    const rejected = confirmation.warn('AbpUi::AreYouSure', undefined, options);
    await flushPromises();
    expect(wrapper.findAll('button').map(button => button.text())).toEqual([
      options.yesText,
      options.cancelText,
    ]);
    await wrapper.findAll('button')[1]?.trigger('click');
    await expect(rejected).resolves.toBe(ConfirmationStatus.reject);
  });
});

describe.each(['en'] as const)('plain reference controls %s resource graph', culture => {
  it('reads the spinner default label from the backend and preserves an explicit host label', async () => {
    const { wrapper, localization } = render(culture, AbpSpinner);
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe(
      localization.t('AbpUi::LoadingWithThreeDot'),
    );
    await wrapper.setProps({ label: 'Host loading status' });
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe('Host loading status');
  });

  it('reads toast dismissal text from the backend without changing dismissal', async () => {
    const { wrapper, localization, toaster } = render(culture, PlainToastHost);
    toaster.success('AbpUi::SavedSuccessfully');
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toContain(
      localization.t('AbpUi::SavedSuccessfully'),
    );
    const dismiss = wrapper.get('button');
    expect(dismiss.attributes('aria-label')).toBe(localization.t('AbpUi::Close'));
    await dismiss.trigger('click');
    expect(toaster.toasts.value).toHaveLength(0);
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it('reads date clearing text from the backend without changing its emitted value', async () => {
    const { wrapper, localization } = render(culture, PlainDatePicker, {
      modelValue: '2026-10-21',
      clearable: true,
      ariaLabel: 'Host record date',
    });
    const clear = wrapper.get('button');
    expect(clear.attributes('aria-label')).toBe(localization.t('AbpUi::Clear'));
    await clear.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
    expect(wrapper.get('input').attributes('aria-label')).toBe('Host record date');
  });

  it('names pagination and page size with backend entry templates and preserves a host name', async () => {
    const { wrapper, localization } = render(culture, AbpPagination, {
      page: 0,
      pageSize: 10,
      total: 35,
      showSizeSelector: true,
    });
    expect(wrapper.get('nav').attributes('aria-label')).toBe(
      localization.t('AbpUi::PagerInfo{0}{1}{2}', 1, 10, 35),
    );
    expect(wrapper.get('select').attributes('aria-label')).toBe(
      localization.t('AbpUi::PagerShowMenuEntries').replace('_MENU_', '10'),
    );
    await wrapper.setProps({ pageSize: 25 });
    expect(wrapper.get('nav').attributes('aria-label')).toBe(
      localization.t('AbpUi::PagerInfo{0}{1}{2}', 1, 25, 35),
    );
    expect(wrapper.get('select').attributes('aria-label')).toBe(
      localization.t('AbpUi::PagerShowMenuEntries').replace('_MENU_', '25'),
    );
    await wrapper.setProps({ ariaLabel: 'Host pagination' });
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Host pagination');
  });
});
