import { AuthService, inject } from '@lsw-abpvue/core';
import type { NavigationGuard } from 'vue-router';

/**
 * Keeps the account pages off the screen when the application does not log in with its
 * own form. With the authorization code flow the identity server owns login, register
 * and password recovery, so asking for them here hands over to it instead.
 */
export const authenticationFlowGuard: NavigationGuard = async () => {
  const auth = inject(AuthService, { optional: true });
  if (!auth || auth.isInternalAuth) return true;

  await auth.navigateToLogin();
  return false;
};
