import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type ApplicationConfigurationDto,
  type Injector,
  type NameValue,
  type ProviderInput,
} from '@lsw-abpvue/core';
import {
  EmailSettingsService,
  TimeZoneSettingsService,
  type EmailSettingsDto,
} from '@lsw-abpvue/setting-management/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import EmailSettingsTab from './EmailSettingsTab.vue';
import TimeZoneSettingsTab from './TimeZoneSettingsTab.vue';

const EMAIL: EmailSettingsDto = {
  smtpHost: 'smtp.abp.io',
  smtpPort: 25,
  smtpUserName: 'postman',
  smtpPassword: null as unknown as undefined,
  smtpDomain: '',
  smtpEnableSsl: false,
  smtpUseDefaultCredentials: false,
  defaultFromAddress: 'noreply@abp.io',
  defaultFromDisplayName: 'ABP application',
};

const ZONES: NameValue[] = [
  { name: 'Default time zone', value: 'Unspecified' },
  { name: 'Europe/Paris (+01:00)', value: 'Europe/Paris' },
];

const mounted: VueWrapper[] = [];

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

function injectorWith(providers: ProviderInput[], policies: string[] = []): Injector {
  const injector = createInjector([...plainTheme.providers, ...providers]);
  const configState = injector.get(ConfigStateService);

  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: Object.fromEntries(policies.map(name => [name, true])) },
    currentUser: {
      id: 'user-1',
      userName: 'admin',
      email: 'admin@abp.io',
      isAuthenticated: true,
      emailVerified: true,
      phoneNumberVerified: false,
      roles: ['admin'],
    },
  } as ApplicationConfigurationDto);

  return injector;
}

async function render(page: Component, injector: Injector): Promise<VueWrapper> {
  const wrapper: VueWrapper = mount(page as never, {
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: {
        $t: (key: string | { defaultValue: string }) =>
          typeof key === 'string' ? key : key.defaultValue,
      },
    },
  });

  mounted.push(wrapper);
  await new Promise(resolve => setTimeout(resolve));
  await wrapper.vm.$nextTick();

  return wrapper;
}

describe('EmailSettingsTab', () => {
  const emailService = (update = vi.fn(() => Promise.resolve())): ProviderInput => ({
    provide: EmailSettingsService,
    useValue: {
      get: () => Promise.resolve(EMAIL),
      update,
      sendTestEmail: () => Promise.resolve(),
    } as unknown as EmailSettingsService,
  });

  it('fills the form from the server and hides the credentials it does not need', async () => {
    const page = await render(EmailSettingsTab, injectorWith([emailService()]));

    expect((page.find('input[type="email"]').element as HTMLInputElement).value).toBe(
      'noreply@abp.io',
    );
    expect(page.text()).toContain('SmtpUserName');
  });

  it('sends an empty password rather than the one it never received', async () => {
    const update = vi.fn(() => Promise.resolve());
    const page = await render(EmailSettingsTab, injectorWith([emailService(update)]));

    await page.find('form').trigger('submit');
    await new Promise(resolve => setTimeout(resolve));

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ smtpPassword: '' }));
  });

  it('addresses the test mail to the person asking for it', async () => {
    const page = await render(
      EmailSettingsTab,
      injectorWith([emailService()], ['SettingManagement.Emailing.Test']),
    );

    const send = [...document.querySelectorAll('button')].find(
      button => button.textContent?.trim() === 'AbpSettingManagement::SendTestEmail',
    );
    send?.click();
    await new Promise(resolve => setTimeout(resolve));
    await page.vm.$nextTick();

    const boxes = [...document.querySelectorAll<HTMLInputElement>('input[type="email"]')];
    expect(boxes.map(box => box.value)).toContain('admin@abp.io');
  });

  it('offers the test mail only to whoever may send one', async () => {
    const without = await render(EmailSettingsTab, injectorWith([emailService()]));
    expect(without.text()).not.toContain('AbpSettingManagement::SendTestEmail');

    const withIt = await render(
      EmailSettingsTab,
      injectorWith([emailService()], ['SettingManagement.Emailing.Test']),
    );
    expect(withIt.text()).toContain('AbpSettingManagement::SendTestEmail');
  });
});

describe('TimeZoneSettingsTab', () => {
  it('selects the zone the backend is on', async () => {
    const update = vi.fn(() => Promise.resolve());
    const injector = injectorWith([
      {
        provide: TimeZoneSettingsService,
        useValue: {
          get: () => Promise.resolve('Europe/Paris'),
          getTimezones: () => Promise.resolve(ZONES),
          update,
        } as unknown as TimeZoneSettingsService,
      },
    ]);

    const page = await render(TimeZoneSettingsTab, injector);

    expect(page.text()).toContain('Europe/Paris (+01:00)');

    await page.find('form').trigger('submit');
    await new Promise(resolve => setTimeout(resolve));

    expect(update).toHaveBeenCalledWith('Europe/Paris');
  });
});
