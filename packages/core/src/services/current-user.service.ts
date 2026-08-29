import { computed, type ComputedRef } from 'vue';
import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import type { CurrentUserDto } from '../proxy/models';
import { ConfigStateService } from './config-state.service';

export const CurrentUserService = defineService('CurrentUserService', () => {
  const user = inject(ConfigStateService).getOne('currentUser');

  return {
    user: user as ComputedRef<CurrentUserDto>,
    isAuthenticated: computed(() => user.value.isAuthenticated),
    roles: computed(() => user.value.roles),
    /** True while an administrator is acting as this user. */
    isImpersonating: computed(() => Boolean(user.value.impersonatorUserId)),
  };
});
export type CurrentUserService = ServiceOf<typeof CurrentUserService>;

export const useCurrentUser = (): CurrentUserService => inject(CurrentUserService);
