import { ABP_INJECTOR_KEY, createInjector, type Injector } from '@lsw-abpvue/core';
import { ConfirmationService, ConfirmationStatus } from '@lsw-abpvue/theme-shared';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { provideAbpThemeBasic } from '../providers/theme-basic.provider.js';
import AbpConfirmHost from './AbpConfirmHost.vue';

const mounted: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  for (const injector of injectors.splice(0)) injector.destroy();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('AbpConfirmHost accessible title', () => {
  it.each(['provided title', 'message only'] as const)(
    'associates a real dialog title without Reka accessibility warnings for %s',
    async mode => {
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const injector = createInjector([provideAbpThemeBasic()]);
      injectors.push(injector);
      const wrapper = mount(AbpConfirmHost, {
        attachTo: document.body,
        global: { provide: { [ABP_INJECTOR_KEY]: injector } },
      });
      mounted.push(wrapper);
      const confirmation = injector.get(ConfirmationService);
      const response = confirmation.warn(
        'Remove this membership?',
        mode === 'provided title' ? 'Delete user' : undefined,
      );
      await flushPromises();

      const dialog = document.querySelector('[role="alertdialog"]');
      expect(dialog).not.toBeNull();
      const labelledBy = dialog?.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      const title = document.getElementById(labelledBy ?? '');
      expect(title).not.toBeNull();
      expect(title?.textContent?.trim()).not.toBe('');
      if (mode === 'provided title') expect(title?.textContent?.trim()).toBe('Delete user');
      const descriptionId = dialog?.getAttribute('aria-describedby');
      expect(document.getElementById(descriptionId ?? '')?.textContent?.trim()).toBe(
        'Remove this membership?',
      );
      expect(warning.mock.calls.flat().join('\n')).not.toContain('requires a `DialogTitle`');

      confirmation.clear(ConfirmationStatus.reject);
      await expect(response).resolves.toBe(ConfirmationStatus.reject);
    },
  );
});
