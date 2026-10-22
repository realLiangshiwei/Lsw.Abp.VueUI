import {
  ABP_INJECTOR_KEY,
  createInjector,
  LocalizationService,
  type Injector,
} from '@lsw-abpvue/core';
import { AbpModal, ErrorPageService } from '@lsw-abpvue/theme-shared';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { provideAbpThemeBasic } from '../providers/theme-basic.provider.js';
import AbpErrorPage from './AbpErrorPage.vue';

const mounted: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  for (const injector of injectors.splice(0)) injector.destroy();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function context() {
  const injector = createInjector([provideAbpThemeBasic()]);
  injectors.push(injector);
  const Root = defineComponent({
    components: { AbpModal, AbpErrorPage },
    setup() {
      return { open: ref(false), draft: ref('Unsaved author'), saveDisabled: ref(false) };
    },
    template: `
      <main>
        <button type="button" @click="open = true">Edit author</button>
        <AbpModal v-model:visible="open" :dirty="false" aria-label="Edit author">
          <template #header><h2>Edit author</h2></template>
          <label>Author name<input v-model="draft" name="authorName"></label>
          <button type="button" name="saveDraft" :disabled="saveDisabled" @click="saveDisabled = true">Save draft</button>
        </AbpModal>
        <AbpErrorPage />
      </main>
    `,
  });
  const wrapper = mount(Root, {
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: { $t: (key: string) => injector.get(LocalizationService).t(key) },
    },
  });
  mounted.push(wrapper);
  return { wrapper, errorPage: injector.get(ErrorPageService) };
}

async function closeAccessibleError(): Promise<void> {
  const error = document.querySelector<HTMLElement>('.abp-error-page');
  expect(error).not.toBeNull();
  expect(error?.closest('[aria-hidden="true"], [inert]')).toBeNull();
  await vi.waitFor(() => expect(error?.contains(document.activeElement)).toBe(true));
  const close = error?.querySelector<HTMLButtonElement>('button');
  expect(close?.textContent?.trim()).toBe('Close');
  close?.focus();
  await flushPromises();
  expect(document.activeElement).toBe(close);
  close?.click();
  await flushPromises();
  expect(document.querySelector('.abp-error-page')).toBeNull();
}

describe('AbpErrorPage modal interaction', () => {
  it('keeps a standalone page error accessible and restores its originating focus', async () => {
    const { wrapper, errorPage } = context();
    const trigger = wrapper.get('button');
    trigger.element.focus();
    errorPage.show({ status: 0, title: 'Connection failed', details: 'Try the request again.' });
    await flushPromises();

    await closeAccessibleError();
    expect(errorPage.current.value).toBeNull();
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element));
  });

  it('lets the user dismiss a page error above an open editor without hiding its actions or losing the draft', async () => {
    const { wrapper, errorPage } = context();
    const trigger = wrapper.get('button');
    trigger.element.focus();
    await trigger.trigger('click');
    await flushPromises();
    const input = document.querySelector<HTMLInputElement>('input[name="authorName"]');
    if (!input) throw new Error('The real theme editor did not open.');
    input.focus();
    input.value = 'Retained pending change';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();
    expect(document.activeElement).toBe(input);

    errorPage.show({
      status: 0,
      title: 'Connection failed',
      details: 'The write outcome is unknown. Keep the editor open to verify the result.',
    });
    await flushPromises();

    await closeAccessibleError();
    expect(errorPage.current.value).toBeNull();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(input.isConnected).toBe(true);
    expect(input.value).toBe('Retained pending change');
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
  });

  it('restores focus to an available editor control when the originating save button becomes disabled', async () => {
    const { wrapper, errorPage } = context();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    const editor = document.querySelector<HTMLElement>('[role="dialog"]');
    const save = editor?.querySelector<HTMLButtonElement>('button[name="saveDraft"]');
    if (!editor || !save) throw new Error('The real theme editor did not render its save action.');
    save.focus();
    save.click();
    await flushPromises();
    expect(save.disabled).toBe(true);

    errorPage.show({
      status: 0,
      title: 'Connection failed',
      details: 'Verify the write before retrying.',
    });
    await flushPromises();
    await closeAccessibleError();

    expect(editor.isConnected).toBe(true);
    expect(editor.querySelector<HTMLInputElement>('input[name="authorName"]')?.value).toBe(
      'Unsaved author',
    );
    await vi.waitFor(() => {
      expect(editor.contains(document.activeElement)).toBe(true);
      expect(document.activeElement?.matches(':disabled')).toBe(false);
    });
  });
});
