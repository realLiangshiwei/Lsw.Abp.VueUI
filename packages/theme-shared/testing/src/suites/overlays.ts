import { ConfirmationService, ToasterService } from '@lsw-abpvue/theme-shared';
import { WindowService } from '@lsw-abpvue/core';
import { AbpConfirmHost, AbpModal, AbpToastHost } from '@lsw-abpvue/theme-shared';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import {
  findAllRendered,
  findRendered,
  renderContract,
  settle,
  type RenderedContract,
  type ThemeUnderTest,
} from '../harness.js';

export function testModal(theme: ThemeUnderTest): void {
  /** A trigger and a dialog, which is the only way to test what focus does. */
  const page = () =>
    defineComponent({
      name: 'PageWithModal',
      setup() {
        const visible = ref(false);
        const open = () => {
          visible.value = true;
        };

        return () =>
          h('div', [
            h('button', { type: 'button', onClick: open }, 'Open'),
            h(
              AbpModal,
              {
                visible: visible.value,
                'onUpdate:visible': (next: boolean) => {
                  visible.value = next;
                },
              },
              { default: () => h('p', 'Are you sure?') },
            ),
          ]);
      },
    });

  describe('AbpModal', () => {
    it('renders nothing until it is visible', async () => {
      const rendered = renderContract(theme, AbpModal, { props: { visible: false } });
      await settle(rendered);

      expect(findRendered(rendered, '[role="dialog"]')).toBeNull();
    });

    it('is a modal dialog when it is visible', async () => {
      const rendered = renderContract(theme, AbpModal, {
        props: { visible: true },
        slots: { default: '<p>Are you sure?</p>' },
      });
      await settle(rendered);
      const dialog = findRendered(rendered, '[role="dialog"]');

      expect(dialog?.attributes('aria-modal')).toBe('true');
      expect(dialog?.text()).toContain('Are you sure?');
    });

    it('has an accessible name, from its header or from ariaLabel', async () => {
      const titled = renderContract(theme, AbpModal, {
        props: { visible: true },
        slots: { header: '<h2>Delete user</h2>' },
      });
      const named = renderContract(theme, AbpModal, {
        props: { visible: true, ariaLabel: 'Delete user' },
      });

      await settle(titled);
      await settle(named);

      for (const rendered of [titled, named]) {
        const dialog = findRendered(rendered, '[role="dialog"]');
        const labelledBy = dialog?.attributes('aria-labelledby');
        const name = labelledBy
          ? (document.getElementById(labelledBy)?.textContent ?? '')
          : (dialog?.attributes('aria-label') ?? '');

        expect(name).toContain('Delete user');
      }
    });

    it('asks to be closed when Escape is pressed', async () => {
      const rendered = renderContract(theme, AbpModal, {
        props: { visible: true },
        events: ['update:visible'],
      });
      await settle(rendered);

      await findRendered(rendered, '[role="dialog"]')?.trigger('keydown', { key: 'Escape' });

      expect(rendered.emitted('update:visible').at(-1)).toEqual([false]);
    });

    it('stays put on Escape while it is busy', async () => {
      const rendered = renderContract(theme, AbpModal, {
        props: { visible: true, busy: true },
        events: ['update:visible'],
      });
      await settle(rendered);

      await findRendered(rendered, '[role="dialog"]')?.trigger('keydown', { key: 'Escape' });

      expect(rendered.emitted('update:visible')).toHaveLength(0);
      expect(findRendered(rendered, '[role="dialog"]')?.attributes('aria-busy')).toBe('true');
    });

    for (const source of ['dirty prop', 'native input'] as const) {
      it(`asks before discarding changes from ${source}`, async () => {
        const rendered = renderContract(theme, AbpModal, {
          props: { visible: true, dirty: source === 'dirty prop' },
          slots: { default: '<input aria-label="Name" />' },
          events: ['update:visible'],
        });
        await settle(rendered);
        if (source === 'native input') await findRendered(rendered, 'input')?.setValue('Edited');
        const dialog = findRendered(rendered, '[role="dialog"]');
        const confirmation = rendered.injector.get(ConfirmationService);

        await dialog?.trigger('keydown', { key: 'Escape' });
        expect(confirmation.current.value?.message).toBe(
          'AbpUi::AreYouSureYouWantToCancelEditingWarningMessage',
        );
        expect(rendered.emitted('update:visible')).toHaveLength(0);
        confirmation.clear('reject');
        await settle(rendered);
        expect(rendered.emitted('update:visible')).toHaveLength(0);

        await dialog?.trigger('keydown', { key: 'Escape' });
        confirmation.clear('confirm');
        await settle(rendered);
        expect(rendered.emitted('update:visible')).toEqual([[false]]);
      });
    }

    it('lets a footer request the same guarded close', async () => {
      const rendered = renderContract(theme, AbpModal, {
        props: { visible: true, dirty: true },
        slots: {
          footer: ({ close }: { close: () => Promise<void> }) =>
            h('button', { onClick: close }, 'Cancel editing'),
        },
        events: ['update:visible'],
      });
      await settle(rendered);
      const button = findAllRendered(rendered, 'button').find(
        item => item.text() === 'Cancel editing',
      );
      await button?.trigger('click');
      const confirmation = rendered.injector.get(ConfirmationService);
      expect(confirmation.current.value).not.toBeNull();
      expect(rendered.emitted('update:visible')).toHaveLength(0);
      confirmation.clear('confirm');
      await settle(rendered);
      expect(rendered.emitted('update:visible')).toEqual([[false]]);
    });

    it('can suppress the unsaved changes confirmation', async () => {
      const rendered = renderContract(theme, AbpModal, {
        props: { visible: true, dirty: true, suppressUnsavedChangesWarning: true },
        events: ['update:visible'],
      });
      await settle(rendered);
      await findRendered(rendered, '[role="dialog"]')?.trigger('keydown', { key: 'Escape' });
      expect(rendered.injector.get(ConfirmationService).current.value).toBeNull();
      expect(rendered.emitted('update:visible')).toEqual([[false]]);
    });

    it('clears a pending confirmation when the parent closes the modal', async () => {
      const rendered = renderContract(theme, AbpModal, {
        props: { visible: true, dirty: true },
        events: ['update:visible'],
      });
      await settle(rendered);
      await findRendered(rendered, '[role="dialog"]')?.trigger('keydown', { key: 'Escape' });
      await rendered.wrapper.setProps({ visible: false });
      await settle(rendered);
      expect(rendered.injector.get(ConfirmationService).current.value).toBeNull();
      expect(rendered.emitted('update:visible')).toHaveLength(0);
    });

    it('warns before leaving a dirty modal and removes the listener on unmount', async () => {
      const rendered = renderContract(theme, AbpModal, {
        props: { visible: true, dirty: true },
      });
      await settle(rendered);
      const nativeWindow = rendered.injector.get(WindowService).nativeWindow;
      const leaving = new Event('beforeunload', { cancelable: true });
      nativeWindow?.dispatchEvent(leaving);
      expect(leaving.defaultPrevented).toBe(true);

      rendered.wrapper.unmount();
      const afterUnmount = new Event('beforeunload', { cancelable: true });
      nativeWindow?.dispatchEvent(afterUnmount);
      expect(afterUnmount.defaultPrevented).toBe(false);
    });

    it('does not ask the same unsaved changes question twice', async () => {
      const rendered = renderContract(theme, AbpModal, {
        props: { visible: true, dirty: true },
      });
      await settle(rendered);
      const dialog = findRendered(rendered, '[role="dialog"]');
      const confirmation = rendered.injector.get(ConfirmationService);
      await dialog?.trigger('keydown', { key: 'Escape' });
      const first = confirmation.current.value;
      await dialog?.trigger('keydown', { key: 'Escape' });
      expect(confirmation.current.value).toBe(first);
      confirmation.clear('reject');
    });

    it('moves focus into itself and gives it back to whatever opened it', async () => {
      const rendered = renderContract(theme, page(), {});
      const { wrapper } = rendered;
      const trigger = wrapper.find('button').element as HTMLElement;

      trigger.focus();
      await wrapper.find('button').trigger('click');
      await settle(rendered);
      await settle(rendered);

      const dialog = findRendered(rendered, '[role="dialog"]');
      expect(dialog?.element.contains(document.activeElement)).toBe(true);

      await dialog?.trigger('keydown', { key: 'Escape' });
      await settle(rendered);
      await settle(rendered);

      expect(document.activeElement).toBe(trigger);
    });

    it('says when it appeared and when it went away', async () => {
      const { wrapper, emitted } = renderContract(theme, AbpModal, {
        props: { visible: false },
        events: ['init', 'appear', 'disappear'],
      });

      await wrapper.setProps({ visible: true });
      await wrapper.vm.$nextTick();
      expect(emitted('init')).toHaveLength(1);
      await wrapper.vm.$nextTick();
      expect(emitted('appear')).toHaveLength(1);

      await wrapper.setProps({ visible: false });
      expect(emitted('disappear')).toHaveLength(1);
    });
  });
}

export function testToastHost(theme: ThemeUnderTest): void {
  describe('AbpToastHost', () => {
    it('renders one entry per toast', async () => {
      const { wrapper, injector } = renderContract(theme, AbpToastHost, {});
      const toaster = injector.get(ToasterService);

      toaster.success('Saved.');
      toaster.info('And another.');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Saved.');
      expect(wrapper.text()).toContain('And another.');
    });

    it('shows only the toasts of its own container', async () => {
      const { wrapper, injector } = renderContract(theme, AbpToastHost, {});
      const toaster = injector.get(ToasterService);

      toaster.info('On the page.');
      toaster.info('In the dialog.', undefined, { containerKey: 'dialog' });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('On the page.');
      expect(wrapper.text()).not.toContain('In the dialog.');
    });

    it('announces an error rather than leaving it to be noticed', async () => {
      const rendered = renderContract(theme, AbpToastHost, {});

      rendered.injector.get(ToasterService).error('That did not work.');
      await settle(rendered);

      expect(findRendered(rendered, '[role="alert"], [aria-live="assertive"]')).not.toBeNull();
    });

    it('takes a toast away when it is dismissed', async () => {
      const rendered = renderContract(theme, AbpToastHost, {});
      const toaster = rendered.injector.get(ToasterService);

      toaster.info('Saved.');
      await settle(rendered);

      await findAllRendered(rendered, 'button').at(-1)?.trigger('click');

      expect(toaster.toasts.value).toHaveLength(0);
    });
  });
}

export function testConfirmHost(theme: ThemeUnderTest): void {
  const ask = async (options: Record<string, unknown> = {}) => {
    const rendered = renderContract(theme, AbpConfirmHost, {});
    const confirmation = rendered.injector.get(ConfirmationService);
    const answer = confirmation.warn('Delete this user?', 'Are you sure?', {
      yesText: 'Yes please',
      cancelText: 'No thanks',
      ...options,
    });
    await settle(rendered);

    return { ...rendered, confirmation, answer };
  };

  const button = (rendered: RenderedContract, text: string) =>
    findAllRendered(rendered, 'button').find(item => item.text() === text);

  describe('AbpConfirmHost', () => {
    it('renders nothing while nothing has been asked', async () => {
      const rendered = renderContract(theme, AbpConfirmHost, {});
      await settle(rendered);

      expect(findRendered(rendered, '[role="alertdialog"]')).toBeNull();
    });

    it('shows the question that was asked', async () => {
      const rendered = await ask();
      const dialog = findRendered(rendered, '[role="alertdialog"]');

      expect(dialog?.text()).toContain('Delete this user?');
      expect(dialog?.text()).toContain('Are you sure?');
      rendered.confirmation.clear();
    });

    it('answers confirm and reject', async () => {
      const confirmed = await ask();
      await button(confirmed, 'Yes please')?.trigger('click');
      await expect(confirmed.answer).resolves.toBe('confirm');

      const rejected = await ask();
      await button(rejected, 'No thanks')?.trigger('click');
      await expect(rejected.answer).resolves.toBe('reject');
    });

    it('leaves out the cancel button when it was told to', async () => {
      const rendered = await ask({ hideCancelBtn: true });

      expect(button(rendered, 'No thanks')).toBeUndefined();
      rendered.confirmation.clear();
    });

    it('dismisses on Escape when it is dismissible', async () => {
      const rendered = await ask();

      await findRendered(rendered, '[role="alertdialog"]')?.trigger('keydown', { key: 'Escape' });

      await expect(rendered.answer).resolves.toBe('dismiss');
    });
  });
}
