import { defineService, inject, onServiceDestroy } from '@lsw-abpvue/core';
import { IdentityUserService, type IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import { EntityAction } from '@lsw-abpvue/components';
import { IdentityComponents, type IdentityConfigOptions } from '@lsw-abpvue/identity';
import { ref, shallowRef } from 'vue';

export const UserDetailsService = defineService('UserDetailsService', () => {
  const users = inject(IdentityUserService);
  const visible = ref(false);
  const busy = ref(false);
  const record = shallowRef<IdentityUserDto>();
  let request: AbortController | undefined;
  let generation = 0;
  function close(): void {
    generation++;
    request?.abort();
    request = undefined;
    visible.value = false;
    record.value = undefined;
    busy.value = false;
  }
  onServiceDestroy(close);
  return {
    visible,
    busy,
    record,
    close,
    async show(id: string): Promise<void> {
      if (busy.value) return;
      busy.value = true;
      const current = generation;
      request = new AbortController();
      try {
        const detail = await users.get(id, { signal: request.signal });
        if (current !== generation) return;
        record.value = detail;
        visible.value = true;
      } catch {
        /* Framework error handlers report the failed detail request. */
      } finally {
        if (current === generation) {
          busy.value = false;
          request = undefined;
        }
      }
    },
  };
});
export const userDetails = {
  entityActionContributors: {
    [IdentityComponents.Users]: [
      actions =>
        actions.addTail(
          EntityAction.create<IdentityUserDto>({
            text: 'BookStore::Details',
            icon: 'bi bi-info-circle',
            permission: 'AbpIdentity.Users',
            action: data => {
              if (data.record.id) return data.getInjected(UserDetailsService).show(data.record.id);
            },
          }),
        ),
    ],
  },
} satisfies IdentityConfigOptions;
