import { inject, WindowService } from '@lsw-abpvue/core';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { AbpModalProps } from '../contracts/modal.js';
import { ConfirmationStatus } from '../models/confirmation.js';
import { useConfirmation } from '../services/confirmation.service.js';

/**
 * Shares the modal's user close behavior across themes.
 * @param props The modal's reactive props
 * @param close Commits a close after the guard allows it
 */
export function useModal(
  props: Readonly<
    Pick<AbpModalProps, 'visible' | 'busy' | 'dirty' | 'suppressUnsavedChangesWarning'>
  >,
  close: () => void,
) {
  const confirmation = useConfirmation();
  const windowService = inject(WindowService);
  const edited = ref(false);
  const pending = ref(false);
  const dirty = computed(() => Boolean(props.dirty || edited.value));
  let generation = 0;
  let confirmationId: number | undefined;

  function clearConfirmation(): void {
    if (confirmationId !== undefined && confirmation.current.value?.id === confirmationId) {
      confirmation.clear();
    }
    confirmationId = undefined;
  }

  watch(
    () => props.visible,
    () => {
      generation += 1;
      edited.value = false;
      clearConfirmation();
    },
  );

  const markDirty = (): void => {
    edited.value = true;
  };

  async function requestClose(): Promise<void> {
    if (!props.visible || props.busy || pending.value) return;
    if (!dirty.value || props.suppressUnsavedChangesWarning) {
      close();
      return;
    }

    pending.value = true;
    const currentGeneration = generation;
    try {
      const answer = confirmation.warn(
        'AbpUi::AreYouSureYouWantToCancelEditingWarningMessage',
        'AbpUi::AreYouSure',
        { dismissible: false },
      );
      confirmationId = confirmation.current.value?.id;
      const status = await answer;
      if (
        status === ConfirmationStatus.confirm &&
        generation === currentGeneration &&
        !props.busy
      ) {
        close();
      }
    } finally {
      pending.value = false;
      confirmationId = undefined;
    }
  }

  function beforeUnload(event: BeforeUnloadEvent): void {
    if (!props.visible || !dirty.value || props.suppressUnsavedChangesWarning) return;
    event.preventDefault();
    event.returnValue = '';
  }

  windowService.nativeWindow?.addEventListener('beforeunload', beforeUnload);
  onBeforeUnmount(() => {
    generation += 1;
    clearConfirmation();
    windowService.nativeWindow?.removeEventListener('beforeunload', beforeUnload);
  });

  return { requestClose, markDirty };
}
