import { ConfirmationService, ToasterService } from '@lsw-abpvue/theme-shared';
import { AbpConfirmHost, AbpModal, AbpToastHost } from '@lsw-abpvue/theme-shared';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { renderContract, type ThemeUnderTest } from '../harness.js';

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
    it('renders nothing until it is visible', () => {
      const { wrapper } = renderContract(theme, AbpModal, { props: { visible: false } });

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });

    it('is a modal dialog when it is visible', () => {
      const { wrapper } = renderContract(theme, AbpModal, {
        props: { visible: true },
        slots: { default: '<p>Are you sure?</p>' },
      });
      const dialog = wrapper.find('[role="dialog"]');

      expect(dialog.exists()).toBe(true);
      expect(dialog.attributes('aria-modal')).toBe('true');
      expect(wrapper.text()).toContain('Are you sure?');
    });

    it('has an accessible name, from its header or from ariaLabel', () => {
      const titled = renderContract(theme, AbpModal, {
        props: { visible: true },
        slots: { header: '<h2>Delete user</h2>' },
      });
      const named = renderContract(theme, AbpModal, {
        props: { visible: true, ariaLabel: 'Delete user' },
      });

      for (const { wrapper } of [titled, named]) {
        const dialog = wrapper.find('[role="dialog"]');
        const labelledBy = dialog.attributes('aria-labelledby');
        const name = labelledBy
          ? (wrapper.element.querySelector(`#${labelledBy}`)?.textContent ?? '')
          : (dialog.attributes('aria-label') ?? '');

        expect(name).toContain('Delete user');
      }
    });

    it('asks to be closed when Escape is pressed', async () => {
      const { wrapper, emitted } = renderContract(theme, AbpModal, {
        props: { visible: true },
        events: ['update:visible'],
      });

      await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' });

      expect(emitted('update:visible').at(-1)).toEqual([false]);
    });

    it('stays put on Escape while it is busy', async () => {
      const { wrapper, emitted } = renderContract(theme, AbpModal, {
        props: { visible: true, busy: true },
        events: ['update:visible'],
      });

      await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' });

      expect(emitted('update:visible')).toHaveLength(0);
      expect(wrapper.find('[role="dialog"]').attributes('aria-busy')).toBe('true');
    });

    it('moves focus into itself and gives it back to whatever opened it', async () => {
      const { wrapper } = renderContract(theme, page(), {});
      const trigger = wrapper.find('button').element as HTMLElement;

      trigger.focus();
      await wrapper.find('button').trigger('click');
      await wrapper.vm.$nextTick();

      const dialog = wrapper.find('[role="dialog"]').element;
      expect(dialog.contains(document.activeElement)).toBe(true);

      await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' });
      await wrapper.vm.$nextTick();

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
      const { wrapper, injector } = renderContract(theme, AbpToastHost, {});

      injector.get(ToasterService).error('That did not work.');
      await wrapper.vm.$nextTick();

      const live = wrapper.find('[role="alert"], [aria-live="assertive"]');
      expect(live.exists()).toBe(true);
    });

    it('takes a toast away when it is dismissed', async () => {
      const { wrapper, injector } = renderContract(theme, AbpToastHost, {});
      const toaster = injector.get(ToasterService);

      toaster.info('Saved.');
      await wrapper.vm.$nextTick();

      await wrapper.find('button').trigger('click');

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
    await rendered.wrapper.vm.$nextTick();

    return { ...rendered, confirmation, answer };
  };

  const button = (wrapper: ReturnType<typeof renderContract>['wrapper'], text: string) =>
    wrapper.findAll('button').find(item => item.text() === text);

  describe('AbpConfirmHost', () => {
    it('renders nothing while nothing has been asked', () => {
      const { wrapper } = renderContract(theme, AbpConfirmHost, {});

      expect(wrapper.text()).toBe('');
    });

    it('shows the question that was asked', async () => {
      const { wrapper } = await ask();

      expect(wrapper.text()).toContain('Delete this user?');
      expect(wrapper.text()).toContain('Are you sure?');
      expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true);
    });

    it('answers confirm and reject', async () => {
      const confirmed = await ask();
      await button(confirmed.wrapper, 'Yes please')?.trigger('click');
      await expect(confirmed.answer).resolves.toBe('confirm');

      const rejected = await ask();
      await button(rejected.wrapper, 'No thanks')?.trigger('click');
      await expect(rejected.answer).resolves.toBe('reject');
    });

    it('leaves out the cancel button when it was told to', async () => {
      const { wrapper, confirmation } = await ask({ hideCancelBtn: true });

      expect(button(wrapper, 'No thanks')).toBeUndefined();
      confirmation.clear();
    });

    it('dismisses on Escape when it is dismissible', async () => {
      const { wrapper, answer } = await ask();

      await wrapper.find('[role="alertdialog"]').trigger('keydown', { key: 'Escape' });

      await expect(answer).resolves.toBe('dismiss');
    });
  });
}
