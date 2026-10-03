import { ABP_INJECTOR_KEY, createInjector } from '@lsw-abpvue/core';
import { AbpModal as SharedModal } from '@lsw-abpvue/theme-shared';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { provideAbpThemeBasic } from '../providers/theme-basic.provider.js';
import AbpModal from './AbpModal.vue';

const mounted: ReturnType<typeof mount>[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('AbpModal', () => {
  it('opening through the theme contract keeps its title associated', async () => {
    const warning = vi.spyOn(console, 'warn');
    const wrapper = mount(SharedModal, {
      props: { visible: false },
      slots: { header: '<h2>Edit author</h2>', default: '<input aria-label="Name">' },
      attachTo: document.body,
      global: {
        provide: { [ABP_INJECTOR_KEY]: createInjector([provideAbpThemeBasic()]) },
        mocks: { $t: (key: string) => key },
      },
    });
    mounted.push(wrapper);
    await wrapper.setProps({ visible: true });
    await flushPromises();

    const dialog = document.querySelector('[role="dialog"]');
    const title = dialog?.getAttribute('aria-labelledby');
    expect(document.getElementById(title ?? '')?.textContent).toBe('Edit author');
    expect(warning.mock.calls.flat().join('\n')).not.toContain('requires a `DialogTitle`');
  });

  it('labels its dialog with the visible header', async () => {
    const wrapper = mount(AbpModal, {
      props: { visible: true },
      slots: { header: '<h2>Edit author</h2>', default: '<input aria-label="Name">' },
      attachTo: document.body,
      global: {
        provide: { [ABP_INJECTOR_KEY]: createInjector([]) },
        mocks: { $t: (key: string) => key },
      },
    });
    mounted.push(wrapper);
    await flushPromises();

    const dialog = document.querySelector('[role="dialog"]');
    const titleId = dialog?.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId ?? '')?.textContent).toBe('Edit author');
  });
});
