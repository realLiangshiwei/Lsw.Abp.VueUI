import { AccountService, ProfilePictureType } from '@lsw-abpvue/account-pro/proxy';
import { ABP_INJECTOR_KEY, ConfigStateService, createInjector } from '@lsw-abpvue/core';
import { ConfirmationService, ConfirmationStatus } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import ProfilePictureTab from './ProfilePictureTab.vue';

it.each([ProfilePictureType.None, ProfilePictureType.Gravatar])(
  'saves picture type %s through the generated service',
  async type => {
    const getProfilePicture = vi.fn().mockResolvedValue({ type });
    const setProfilePicture = vi.fn().mockResolvedValue(undefined);
    const injector = createInjector([
      ...plainTheme.providers,
      { provide: AccountService, useValue: { getProfilePicture, setProfilePicture } },
    ]);
    const config = injector.get(ConfigStateService);
    config.setState({
      currentUser: {
        isAuthenticated: true,
        emailVerified: false,
        phoneNumberVerified: false,
        id: 'member',
      },
    });
    vi.spyOn(injector.get(ConfirmationService), 'warn').mockResolvedValue(
      ConfirmationStatus.confirm,
    );
    const wrapper = mount(ProfilePictureTab, {
      global: {
        provide: { [ABP_INJECTOR_KEY]: injector },
        mocks: { $t: (key: string) => key },
      },
    });
    try {
      await flushPromises();
      await wrapper.get('select').setValue(String(type));
      await wrapper.get('form').trigger('submit');
      await flushPromises();
      expect(setProfilePicture).toHaveBeenCalledOnce();
      const [body, options] = setProfilePicture.mock.calls[0] ?? [];
      expect(body).toBeInstanceOf(FormData);
      expect(body.get('Type')).toBe(String(type));
      expect(body.has('ImageContent')).toBe(false);
      expect(options.signal).toBeInstanceOf(AbortSignal);
      expect(getProfilePicture).toHaveBeenCalledTimes(2);
    } finally {
      wrapper.unmount();
      injector.destroy();
    }
  },
);
