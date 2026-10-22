import { ManageProfileStateService } from '@lsw-abpvue/account-core';
import { computed, shallowRef, watch } from 'vue';
import {
  ConfigStateService,
  defineService,
  inject,
  onServiceDestroy,
  type ServiceOf,
} from '@lsw-abpvue/core';
import type { ProfileDto } from '@lsw-abpvue/account-pro/proxy';

export const AccountProProfileStateService = defineService('AccountProProfileStateService', () => {
  const shared = inject(ManageProfileStateService);
  const config = inject(ConfigStateService);
  const profile = shallowRef<ProfileDto | null>(null);
  const canEnableTwoFactor = shallowRef(false);
  onServiceDestroy(
    watch(
      [() => config.snapshot().currentUser.id, () => config.snapshot().currentTenant.id],
      () => {
        profile.value = null;
        canEnableTwoFactor.value = false;
        shared.set(null);
      },
      { flush: 'sync' },
    ),
  );

  return {
    profile: computed(() => profile.value),
    canEnableTwoFactor: computed(() => canEnableTwoFactor.value),
    set(value: ProfileDto | null, canEnable = false): void {
      profile.value = value;
      canEnableTwoFactor.value = canEnable;
      shared.set(value);
    },
  };
});
export type AccountProProfileStateService = ServiceOf<typeof AccountProProfileStateService>;
