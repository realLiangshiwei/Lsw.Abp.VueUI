import {
  APP_INITIALIZERS,
  AuthService,
  ConfigStateService,
  CookieService,
  createInjector,
  LocalizationService,
  ReplaceableComponentsService,
  RoutesService,
  WindowService,
  ABP_INJECTOR_KEY,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { UserMenuService } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createGdprRoutes } from '../../src/routes.js';
import AbpGdprCookieConsent from './components/AbpGdprCookieConsent.vue';
import AbpGdprPolicyLinks from './components/AbpGdprPolicyLinks.vue';
import { GdprConfigComponents } from './enums/components.js';
import type { AbpCookieConsentOptions } from './models/options.js';
import { provideGdprConfig, withCookieConsentOptions } from './providers/gdpr-config.provider.js';
import { CookieConsentService } from './services/cookie-consent.service.js';

const injectors: Injector[] = [];
const wrappers: VueWrapper[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
  vi.restoreAllMocks();
});

function start(options: AbpCookieConsentOptions = {}, providers: ProviderInput[] = []) {
  const authenticated = ref(true);
  const injector = createInjector([
    ...plainTheme.providers,
    provideGdprConfig(withCookieConsentOptions(options)),
    { provide: AuthService, useValue: { isAuthenticated: computed(() => authenticated.value) } },
    ...providers,
  ]);
  injectors.push(injector);
  for (const initialize of injector.get(APP_INITIALIZERS, [], { optional: true }))
    injector.runInContext(initialize);
  return { injector, authenticated };
}

describe('GDPR configuration', () => {
  it('registers hidden navigation and an authenticated personal data menu item', () => {
    const { injector, authenticated } = start();
    expect(injector.get(RoutesService).flat.value).toContainEqual(
      expect.objectContaining({
        name: 'Gdpr.GdprComponent',
        path: '/gdpr',
        invisible: true,
        breadcrumbText: 'AbpGdpr::Menu:PersonalData',
      }),
    );
    const menu = injector.get(UserMenuService);
    const item = menu.flat.value.find(item => item.name === 'Gdpr.GdprNavigation');
    expect(item).toMatchObject({ path: '/gdpr', order: 100, text: 'AbpGdpr::Menu:PersonalData' });
    expect(item?.visible?.()).toBe(true);
    authenticated.value = false;
    expect(item?.visible?.()).toBe(false);
  });

  it('protects the replaceable personal data route with authentication', () => {
    const routes = createGdprRoutes();
    expect(routes[0]?.meta?.requiresAuthentication).toBe(true);
    expect(routes[0]?.children?.[0]?.meta).toMatchObject({
      title: 'AbpGdpr::PersonalData',
      replaceableComponent: { key: 'Gdpr.GdprComponent' },
    });
  });

  it('defaults to enabled with a six-month expiry and preserves explicit false', () => {
    const now = new Date();
    const initial = start().injector.get(CookieConsentService).cookieConsentOptions.value;
    expect(initial.isEnabled).toBe(true);
    expect(initial.expireDate).toEqual(
      new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()),
    );
    const expiry = new Date('2099-01-01');
    const disabled = start({ isEnabled: false, expireDate: expiry }).injector.get(
      CookieConsentService,
    ).cookieConsentOptions.value;
    expect(disabled).toEqual({ isEnabled: false, expireDate: expiry });
  });

  it('keeps options local to each application injector', () => {
    const first = start({ cookiePolicyUrl: '/cookies' }).injector.get(CookieConsentService);
    const second = start().injector.get(CookieConsentService);
    first.setOptions({ isEnabled: false });
    expect(first.cookieConsentOptions.value.isEnabled).toBe(false);
    expect(second.cookieConsentOptions.value.isEnabled).toBe(true);
  });

  it('uses the last cookie options feature without retaining earlier options', () => {
    const { injector } = start({}, [
      provideGdprConfig(
        withCookieConsentOptions({ isEnabled: false, cookiePolicyUrl: '/earlier' }),
        withCookieConsentOptions({ privacyPolicyUrl: '/latest' }),
      ),
    ]);
    const options = injector.get(CookieConsentService).cookieConsentOptions.value;
    expect(options.isEnabled).toBe(true);
    expect(options.privacyPolicyUrl).toBe('/latest');
    expect(options.cookiePolicyUrl).toBeUndefined();
  });
});

describe('cookie consent', () => {
  async function render(options: AbpCookieConsentOptions = {}, cookie?: string, browser = true) {
    const set = vi.fn();
    const { injector } = start(options, [
      {
        provide: CookieService,
        useValue: { get: (key: string) => (key === '.AspNet.Consent' ? cookie : undefined), set },
      },
      { provide: WindowService, useValue: { nativeWindow: browser ? window : undefined } },
    ]);
    const page = mount(AbpGdprCookieConsent, {
      global: { provide: { [ABP_INJECTOR_KEY]: injector }, mocks: { $t: (key: string) => key } },
    });
    wrappers.push(page);
    await flushPromises();
    return { page, set, injector };
  }

  it('shows the consent and writes the official cookie, expiry and root path on acceptance', async () => {
    const expiry = new Date('2099-01-01');
    const { page, set } = await render({ expireDate: expiry });
    expect(page.find('[role="alert"]').exists()).toBe(true);
    await page.get('button').trigger('click');
    expect(set).toHaveBeenCalledWith('.AspNet.Consent', 'true', { expires: expiry, path: '/' });
    expect(page.find('[role="alert"]').exists()).toBe(false);
  });

  it.each([{ isEnabled: false }, { cookie: 'true' }, { browser: false }])(
    'hides the banner for %j',
    async scenario => {
      const { page, set } = await render(
        { isEnabled: 'isEnabled' in scenario ? scenario.isEnabled : true },
        'cookie' in scenario ? scenario.cookie : undefined,
        'browser' in scenario ? scenario.browser : true,
      );
      await flushPromises();
      expect(page.find('[role="alert"]').exists()).toBe(false);
      expect(set).not.toHaveBeenCalled();
    },
  );

  it('does not accept an invalid expiry', async () => {
    const { page, set } = await render({ expireDate: new Date('invalid') });
    await page.get('button').trigger('click');
    expect(set).not.toHaveBeenCalled();
    expect(page.find('[role="alert"]').exists()).toBe(true);
  });

  it('responds to option changes and honors the official replacement key', async () => {
    const { page, injector } = await render();
    injector.get(CookieConsentService).setOptions({ isEnabled: false });
    await flushPromises();
    expect(page.find('[role="alert"]').exists()).toBe(false);
    injector.get(ReplaceableComponentsService).add({
      key: GdprConfigComponents.CookieConsent,
      component: defineComponent(() => () => h('p', 'Custom consent')),
    });
    await flushPromises();
    expect(page.text()).toBe('Custom consent');
  });
});

describe('policy links', () => {
  async function render(link: AbpCookieConsentOptions) {
    const injector = createInjector([
      {
        provide: WindowService,
        useValue: { nativeWindow: { location: { origin: 'https://app.example' } } },
      },
    ]);
    injectors.push(injector);
    const config = injector.get(ConfigStateService);
    const texts = {
      CookiePolicy: 'Cookies',
      PrivacyPolicy: 'Privacy',
      CookieConsentAgreePolicies: 'Read {0} and {1}.',
      CookieConsentAgreePolicy: 'Read {0}.',
    };
    config.setState({
      ...config.snapshot(),
      localization: { ...config.snapshot().localization, values: { AbpGdpr: texts } },
    });
    const localization = injector.get(LocalizationService);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
    });
    await router.push('/');
    const page = mount(AbpGdprPolicyLinks, {
      props: { link },
      global: {
        plugins: [router],
        provide: { [ABP_INJECTOR_KEY]: injector },
        mocks: { $t: localization.t },
      },
    });
    wrappers.push(page);
    return { page, config };
  }

  it('routes local links and opens external policies in a new tab', async () => {
    const { page } = await render({
      cookiePolicyUrl: 'https://app.example/cookies?version=1#policy',
      privacyPolicyUrl: 'https://policies.example/privacy',
    });
    const links = page.findAll('a');
    expect(links[0]?.attributes('href')).toBe('/cookies?version=1#policy');
    expect(links[0]?.attributes('target')).toBeUndefined();
    expect(links[1]?.attributes()).toMatchObject({
      href: 'https://policies.example/privacy',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    expect(page.element.textContent).toBe('Read Cookies and Privacy.');
  });

  it.each(['cookiePolicyUrl', 'privacyPolicyUrl'] as const)(
    'uses the single-policy localization for %s',
    async name => {
      const { page } = await render({ [name]: '/policy' });
      expect(page.element.textContent).toBe(
        name === 'cookiePolicyUrl' ? 'Read Cookies.' : 'Read Privacy.',
      );
      expect(page.findAll('a')).toHaveLength(1);
    },
  );

  it('updates the words and placeholder order when localization changes', async () => {
    const { page, config } = await render({
      cookiePolicyUrl: '/cookies',
      privacyPolicyUrl: '/privacy',
    });
    config.setState({
      ...config.snapshot(),
      localization: {
        ...config.snapshot().localization,
        values: {
          AbpGdpr: {
            CookiePolicy: 'Cookie rules',
            PrivacyPolicy: 'Privacy rules',
            CookieConsentAgreePolicies: 'Policies: {1}, then {0}.',
          },
        },
      },
    });
    await flushPromises();
    expect(page.element.textContent).toBe('Policies: Privacy rules, then Cookie rules.');
    expect(page.findAll('a').map(link => link.attributes('href'))).toEqual([
      '/privacy',
      '/cookies',
    ]);
  });

  it('renders no policy text for missing or unsafe URLs', async () => {
    const { page } = await render({
      cookiePolicyUrl: 'javascript:alert(1)',
      privacyPolicyUrl: 'data:text/html,policy',
    });
    expect(page.text()).toBe('');
    expect(page.find('a').exists()).toBe(false);
  });
});
