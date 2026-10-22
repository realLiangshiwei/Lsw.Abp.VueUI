import { createInjector } from '@lsw-abpvue/core';
import { ProfileService as CoreProfileService } from '@lsw-abpvue/account-core/proxy';
import { AccountProProfileStateService } from '@lsw-abpvue/account-pro/config';
import { ProfileService, type ProfileDto } from '@lsw-abpvue/account-pro/proxy';
import { expect, it, vi } from 'vitest';
import { provideAccountPro } from './account-pro.provider.js';

it('keeps the shared profile password state current after setting the first password', async () => {
  let finish: (() => void) | undefined;
  const changePassword = vi.fn(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
      }),
  );
  const injector = createInjector([
    provideAccountPro(),
    { provide: ProfileService, useValue: { changePassword } },
  ]);
  try {
    const state = injector.get(AccountProProfileStateService);
    const profile: ProfileDto = {
      userName: 'member',
      emailConfirmed: true,
      phoneNumberConfirmed: false,
      isExternal: false,
      hasPassword: false,
      supportsMultipleTimezone: false,
      extraProperties: {},
    };
    state.set(profile, true);
    const service = injector.get(CoreProfileService);
    const first = service.changePassword({ newPassword: 'Example-password1!' });
    finish?.();
    await first;
    expect(state.profile.value?.hasPassword).toBe(true);
    expect(state.canEnableTwoFactor.value).toBe(true);
    const pending = service.changePassword({
      currentPassword: 'Example-password1!',
      newPassword: 'Example-password2!',
    });
    state.set(profile, false);
    finish?.();
    await pending;
    expect(state.profile.value?.hasPassword).toBe(false);
  } finally {
    injector.destroy();
  }
});
