import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  LocalizationService,
  SessionStateService,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { LanguageManagementPolicyNames as Policy } from '@lsw-abpvue/language-management/config';
import {
  LanguageService,
  LanguageTextService,
  type LanguageDto,
  type LanguageTextDto,
} from '@lsw-abpvue/language-management/proxy';
import { ConfirmationService, ConfirmationStatus } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick, type Component } from 'vue';
import { LanguageManagementComponents as Keys } from '../enums/components.js';
import { provideLanguageManagement } from '../providers/language-management.provider.js';
import { languageManagementExtensionsResolver } from '../resolvers/extensions.resolver.js';
import type { LanguageManagementConfigOptions } from '../tokens/extensions.token.js';
import LanguagesPage from './LanguagesPage.vue';
import LanguageTextsPage from './LanguageTextsPage.vue';

const language: LanguageDto = {
  id: 'language-1',
  cultureName: 'en',
  uiCultureName: 'en',
  displayName: 'English',
  isEnabled: true,
  isDefaultLanguage: true,
  concurrencyStamp: 'fresh-stamp',
  extraProperties: { Hidden: 'preserved' },
};
const text: LanguageTextDto = {
  resourceName: 'Example',
  cultureName: 'fr',
  baseCultureName: 'en',
  name: 'Greeting',
  baseValue: 'Hello',
  value: 'Bonjour',
};
const wrappers: VueWrapper[] = [];
const injectors: ReturnType<typeof createInjector>[] = [];

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

function deferred<T>() {
  let resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve: (value: T) => resolve?.(value) };
}

async function settle() {
  await flushPromises();
  await nextTick();
}

async function click(label: string, index = 0) {
  const button = [...document.querySelectorAll('button')].filter(
    element => element.textContent?.trim() === label,
  )[index];
  if (!button) throw new TypeError(`No button is labelled ${label}.`);
  button.click();
  await settle();
}

async function render(
  component: Component,
  options: {
    languages?: Partial<LanguageService>;
    texts?: Partial<LanguageTextService>;
    policies?: string[];
    providers?: ProviderInput[];
    contributions?: LanguageManagementConfigOptions;
  } = {},
) {
  const languages: LanguageService = {
    apiName: 'LanguageManagement',
    getList: vi.fn(async () => ({ items: [language], totalCount: 1 })),
    get: vi.fn(async () => language),
    getCulturelist: vi.fn(async () => [
      { name: 'en', displayName: 'English' },
      { name: 'fr', displayName: 'French' },
    ]),
    getResources: vi.fn(async () => [{ name: 'Example' }]),
    getAllList: vi.fn(async () => ({ items: [language] })),
    create: vi.fn(async () => language),
    update: vi.fn(async () => language),
    delete: vi.fn(async () => {}),
    setAsDefault: vi.fn(async () => {}),
    ...options.languages,
  };
  const texts: LanguageTextService = {
    apiName: 'LanguageManagement',
    getList: vi.fn(async () => ({ items: [text], totalCount: 1 })),
    get: vi.fn(async () => text),
    update: vi.fn(async () => {}),
    restoreToDefault: vi.fn(async () => {}),
    ...options.texts,
  };
  const warn = vi.fn(async () => ConfirmationStatus.confirm);
  const injector = createInjector([
    ...plainTheme.providers,
    ...provideLanguageManagement(options.contributions),
    { provide: LanguageService, useValue: languages },
    { provide: LanguageTextService, useValue: texts },
    { provide: ConfirmationService, useValue: { warn } as unknown as ConfirmationService },
    ...(options.providers ?? []),
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { ...config.snapshot().currentUser, id: 'user-1', isAuthenticated: true },
    auth: {
      grantedPolicies: Object.fromEntries(
        (options.policies ?? Object.values(Policy)).map(policy => [policy, true]),
      ),
    },
    localization: {
      ...config.snapshot().localization,
      currentCulture: { ...config.snapshot().localization.currentCulture, cultureName: 'en' },
      languages: [
        { cultureName: 'en', displayName: 'English' },
        { cultureName: 'fr', displayName: 'French' },
      ],
    },
  });
  const refresh = vi
    .spyOn(config, 'readAppState')
    .mockImplementation(async () => config.snapshot());
  const localization = injector.get(LocalizationService);
  vi.spyOn(localization, 't').mockImplementation(key =>
    typeof key === 'string' ? key : (key.key ?? ''),
  );
  injector.runInContext(languageManagementExtensionsResolver);
  const page: VueWrapper = mount(component, {
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: { $t: (key: string) => key },
      stubs: { RouterLink: true },
    },
  });
  wrappers.push(page);
  await settle();
  return { page, injector, config, languages, texts, warn, refresh, localization };
}

describe('language configuration', () => {
  it('shows cultures, enabled state and the default language', async () => {
    const { page } = await render(LanguagesPage);
    expect(page.text()).toContain('English');
    expect(page.get('strong').text()).toContain('LanguageManagement::DefaultLanguage');
    expect(page.text()).not.toContain('FlagIcon');
  });

  it('requires both cultures and falls back to the culture name when creating', async () => {
    const { page, languages, refresh } = await render(LanguagesPage);
    await click('LanguageManagement::CreateNewLanguage');
    expect(page.find('select#culture-name').exists()).toBe(true);
    await click('AbpUi::Save');
    expect(languages.create).not.toHaveBeenCalled();
    await page.get('#culture-name').setValue('fr');
    await page.get('#ui-culture-name').setValue('en');
    await click('AbpUi::Save');
    expect(languages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cultureName: 'fr',
        uiCultureName: 'en',
        displayName: 'fr',
        isEnabled: false,
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(refresh).toHaveBeenCalledOnce();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
  });

  it('uses fresh details and preserves the stamp and hidden extensions on update', async () => {
    const { page, languages } = await render(LanguagesPage);
    await click('LanguageManagement::Edit');
    expect(languages.get).toHaveBeenCalledWith('language-1', expect.anything());
    expect(page.find('#culture-name').exists()).toBe(false);
    expect(page.find('#ui-culture-name').exists()).toBe(false);
    await page.get('#name').setValue('Updated');
    await click('AbpUi::Save');
    expect(languages.update).toHaveBeenCalledWith(
      'language-1',
      expect.objectContaining({
        displayName: 'Updated',
        isEnabled: true,
        concurrencyStamp: 'fresh-stamp',
        extraProperties: { Hidden: 'preserved' },
      }),
      expect.anything(),
    );
  });

  it('preserves editable values when a contributor removes their fields', async () => {
    const { page, languages } = await render(LanguagesPage, {
      contributions: {
        editFormPropContributors: {
          [Keys.Languages]: [
            props => {
              props.dropByValue('displayName', (prop, name) => prop.name === name);
              props.dropByValue('isEnabled', (prop, name) => prop.name === name);
            },
          ],
        },
      },
    });
    await click('LanguageManagement::Edit');
    expect(page.find('#name').exists()).toBe(false);
    expect(page.find('#is-enabled').exists()).toBe(false);
    await click('AbpUi::Save');
    expect(languages.update).toHaveBeenCalledWith(
      'language-1',
      expect.objectContaining({ displayName: 'English', isEnabled: true }),
      expect.anything(),
    );
  });

  it('submits the language form from the keyboard', async () => {
    const { page, languages } = await render(LanguagesPage);
    await click('LanguageManagement::Edit');
    await page.get('#name').setValue('Keyboard edit');
    await page.get('[role="dialog"] form').trigger('submit');
    await settle();
    expect(languages.update).toHaveBeenCalledWith(
      'language-1',
      expect.objectContaining({ displayName: 'Keyboard edit' }),
      expect.anything(),
    );
  });

  it('rejects display names longer than the official database default', async () => {
    const { page, languages } = await render(LanguagesPage);
    await click('LanguageManagement::Edit');
    await page.get('#name').setValue('x'.repeat(33));
    await click('AbpUi::Save');
    expect(languages.update).not.toHaveBeenCalled();
    expect(page.get<HTMLInputElement>('#name').element.value).toBe('x'.repeat(33));
  });

  it('retains an unsuccessful save and prevents duplicate submissions', async () => {
    const pending = deferred<LanguageDto>();
    const update = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Rejected'))
      .mockReturnValueOnce(pending.promise);
    const { page } = await render(LanguagesPage, { languages: { update } });
    await click('LanguageManagement::Edit');
    await page.get('#name').setValue('Draft');
    await click('AbpUi::Save');
    expect(page.get<HTMLInputElement>('#name').element.value).toBe('Draft');
    await click('AbpUi::Save');
    await click('AbpUi::Save');
    expect(update).toHaveBeenCalledTimes(2);
    pending.resolve(language);
    await settle();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
  });

  it('offers an explicit retry when fresh details fail', async () => {
    const get = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Unavailable'))
      .mockResolvedValueOnce(language);
    const { page, languages } = await render(LanguagesPage, { languages: { get } });
    await click('LanguageManagement::Edit');
    expect(page.get('[role="alert"]').text()).toContain('AbpUi::ErrorLoadingDatatable');
    await click('AbpUi::Save');
    expect(languages.update).not.toHaveBeenCalled();
    await click('AbpUi::Refresh');
    expect(page.get<HTMLInputElement>('#name').element.value).toBe('English');
  });

  it('confirms default language deletion and switches an active language to its fallback', async () => {
    const { page, languages, warn, localization, refresh } = await render(LanguagesPage, {
      languages: {
        getAllList: vi.fn(async () => ({
          items: [{ ...language, id: 'fallback', cultureName: 'fr' }],
        })),
      },
    });
    const switchLanguage = vi.spyOn(localization, 'setLanguage').mockResolvedValue();
    await click('LanguageManagement::Delete');
    expect(warn).toHaveBeenCalledWith(
      'LanguageManagement::DefaultLanguageDeletionConfirmationMessage',
      'AbpUi::AreYouSure',
      { messageLocalizationParams: ['English'] },
    );
    expect(languages.delete).toHaveBeenCalledWith('language-1', expect.anything());
    expect(switchLanguage).toHaveBeenCalledWith('fr');
    expect(refresh).toHaveBeenCalledOnce();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
  });

  it('refreshes configuration after changing the default language', async () => {
    const { languages, refresh } = await render(LanguagesPage);
    await click('LanguageManagement::SetAsDefaultLanguage');
    expect(languages.setAsDefault).toHaveBeenCalledWith('language-1', expect.anything());
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('discards a configuration refresh for a language the user has left', async () => {
    const { config, injector, refresh } = await render(LanguagesPage);
    vi.spyOn(config, 'refreshLocalization').mockResolvedValue();
    const original = config.snapshot();
    const pending = deferred<typeof original>();
    refresh.mockReturnValueOnce(pending.promise);
    await click('LanguageManagement::SetAsDefaultLanguage');
    injector.get(SessionStateService).setLanguage('fr');
    config.setState({
      ...original,
      localization: {
        ...original.localization,
        currentCulture: { ...original.localization.currentCulture, cultureName: 'fr' },
      },
    });
    pending.resolve(original);
    await settle();
    expect(config.snapshot().localization.currentCulture.cultureName).toBe('fr');
  });

  it('hides ungranted actions and closes a draft when its permission is revoked', async () => {
    const { page, config } = await render(LanguagesPage, {
      policies: [Policy.Languages, Policy.LanguagesEdit],
    });
    expect(page.text()).not.toContain('LanguageManagement::CreateNewLanguage');
    expect(page.text()).not.toContain('LanguageManagement::Delete');
    await click('LanguageManagement::Edit');
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { [Policy.Languages]: true } },
    });
    await settle();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
  });

  it('discards a late read after changing tenant and does not reopen its dialog', async () => {
    const pending = deferred<LanguageDto>();
    const { page, injector } = await render(LanguagesPage, {
      languages: { get: vi.fn(() => pending.promise) },
    });
    await click('LanguageManagement::Edit');
    injector.get(SessionStateService).setTenant({ id: 'other-tenant', isAvailable: true });
    pending.resolve(language);
    await settle();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
    expect(page.text()).not.toContain('English');
  });
});

describe('dynamic translations', () => {
  it('waits for an available culture before querying translations', async () => {
    const { config, texts } = await render(LanguageTextsPage);
    config.setState({
      ...config.snapshot(),
      localization: { ...config.snapshot().localization, languages: [] },
    });
    await settle();
    vi.mocked(texts.getList).mockClear();
    config.setState({
      ...config.snapshot(),
      localization: {
        ...config.snapshot().localization,
        languages: [{ cultureName: 'en', displayName: 'English' }],
      },
    });
    await settle();
    expect(texts.getList).toHaveBeenCalledWith(
      expect.objectContaining({ baseCultureName: 'en', targetCultureName: 'en' }),
      expect.anything(),
    );
  });

  it('selects initial cultures and exposes all four filters', async () => {
    const { page, texts } = await render(LanguageTextsPage);
    expect(page.get<HTMLSelectElement>('#base-culture').element.value).toBe('en');
    expect(page.get<HTMLSelectElement>('#target-culture').element.value).toBe('fr');
    await page.get('#resource-name').setValue('Example');
    await page.get('#empty-values').setValue('true');
    await settle();
    expect(texts.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({
        baseCultureName: 'en',
        targetCultureName: 'fr',
        resourceName: 'Example',
        getOnlyEmptyValues: true,
        skipCount: 0,
      }),
      expect.anything(),
    );
  });

  it('saves the chosen text and refreshes active localization', async () => {
    const { page, texts, refresh } = await render(LanguageTextsPage);
    await click('LanguageManagement::Edit');
    expect(page.get<HTMLTextAreaElement>('#base-value').element.disabled).toBe(true);
    await page.get('#target-value').setValue('Changed');
    await click('AbpUi::Save');
    expect(texts.update).toHaveBeenCalledWith(
      'Example',
      'fr',
      'Greeting',
      'Changed',
      expect.anything(),
    );
    expect(page.find('[role="dialog"]').exists()).toBe(false);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('keeps a rejected translation open with its input', async () => {
    const { page } = await render(LanguageTextsPage, {
      texts: { update: vi.fn().mockRejectedValue(new TypeError('Rejected')) },
    });
    await click('LanguageManagement::Edit');
    await page.get('#target-value').setValue('Unsaved');
    await click('AbpUi::Save');
    expect(page.get<HTMLTextAreaElement>('#target-value').element.value).toBe('Unsaved');
  });

  it('finishes a saved translation when loading its successor fails', async () => {
    const rows = [text, { ...text, name: 'Next' }];
    let written = false;
    const { page, texts, refresh } = await render(LanguageTextsPage, {
      texts: {
        getList: vi.fn(async query => {
          if (written) throw new TypeError('Unavailable');
          return {
            items: rows.slice(
              query.skipCount ?? 0,
              (query.skipCount ?? 0) + (query.maxResultCount ?? 10),
            ),
            totalCount: rows.length,
          };
        }),
        update: vi.fn(async () => {
          written = true;
        }),
      },
    });
    await click('LanguageManagement::Edit');
    await page.get('#target-value').setValue('Saved');
    await click('LanguageManagement::SaveAndNext');
    expect(texts.update).toHaveBeenCalledOnce();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('saves and moves to the next page using the configured page size', async () => {
    const rows = Array.from({ length: 26 }, (_, index) => ({
      ...text,
      name: `Key-${index}`,
      value: `Value-${index}`,
    }));
    const getList: LanguageTextService['getList'] = vi.fn(async query => ({
      items: rows.slice(
        query.skipCount ?? 0,
        (query.skipCount ?? 0) + (query.maxResultCount ?? 10),
      ),
      totalCount: rows.length,
    }));
    const { page } = await render(LanguageTextsPage, { texts: { getList } });
    await page.get('select[aria-label*="PagerShowMenuEntries"]').setValue('25');
    await settle();
    await click('LanguageManagement::Edit', 24);
    await click('LanguageManagement::SaveAndNext');
    expect(page.get('[role="dialog"] strong').text()).toBe('Key-25');
    await click('LanguageManagement::SaveAndNext');
    expect(page.find('[role="dialog"]').exists()).toBe(false);
  });

  it('continues editing while the next table page is still loading', async () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({ ...text, name: `Key-${index}` }));
    const pending = deferred<{ items: LanguageTextDto[]; totalCount: number }>();
    const { page } = await render(LanguageTextsPage, {
      texts: {
        getList: vi.fn(async query => {
          if (query.skipCount === 10 && query.maxResultCount === 10) return pending.promise;
          return {
            items: rows.slice(
              query.skipCount ?? 0,
              (query.skipCount ?? 0) + (query.maxResultCount ?? 10),
            ),
            totalCount: rows.length,
          };
        }),
      },
    });
    await click('LanguageManagement::Edit', 9);
    await click('LanguageManagement::SaveAndNext');
    expect(page.get('[role="dialog"] strong').text()).toBe('Key-10');
    await click('LanguageManagement::SaveAndNext');
    expect(page.get('[role="dialog"] strong').text()).toBe('Key-11');
    pending.resolve({ items: rows.slice(10), totalCount: rows.length });
    await settle();
  });

  it.each(['search', 'sorting'] as const)(
    'keeps the following text when saving changes its position under %s',
    async mode => {
      const rows = Array.from({ length: 12 }, (_, index) => ({
        ...text,
        name: `Key-${index}`,
        value: `Match-${String(index).padStart(2, '0')}`,
      }));
      const getList: LanguageTextService['getList'] = vi.fn(async query => {
        const filtered = rows
          .filter(row => !query.filter || row.value.includes(query.filter))
          .sort((left, right) =>
            query.sorting?.startsWith('value') ? left.value.localeCompare(right.value) : 0,
          );
        return {
          items: filtered.slice(
            query.skipCount ?? 0,
            (query.skipCount ?? 0) + (query.maxResultCount ?? 10),
          ),
          totalCount: filtered.length,
        };
      });
      const { page } = await render(LanguageTextsPage, {
        texts: {
          getList,
          update: vi.fn(async (_resource, _culture, name, value) => {
            const row = rows.find(item => item.name === name);
            if (row) row.value = value;
          }),
        },
      });
      if (mode === 'search') {
        await page.get('input[type="search"]').setValue('Match');
        await vi.waitFor(() =>
          expect(getList).toHaveBeenLastCalledWith(
            expect.objectContaining({ filter: 'Match' }),
            expect.anything(),
          ),
        );
      } else await click('LanguageManagement::Value');
      await click('LanguageManagement::Edit', 9);
      await page.get('#target-value').setValue('zz-changed');
      await click('LanguageManagement::SaveAndNext');
      expect(page.get('[role="dialog"] strong').text()).toBe('Key-10');
      await click('LanguageManagement::SaveAndNext');
      expect(page.get('[role="dialog"] strong').text()).toBe('Key-11');
    },
  );

  it('closes an untouched next translation without warning about the previous saved value', async () => {
    const rows = [text, { ...text, name: 'Next', value: '' }];
    const { page, warn } = await render(LanguageTextsPage, {
      texts: {
        getList: vi.fn(async query => ({
          items: rows.slice(
            query.skipCount ?? 0,
            (query.skipCount ?? 0) + (query.maxResultCount ?? 10),
          ),
          totalCount: rows.length,
        })),
      },
    });
    await click('LanguageManagement::Edit');
    await page.get('#target-value').setValue('Saved');
    await click('LanguageManagement::SaveAndNext');
    await click('AbpUi::Cancel');
    expect(warn).not.toHaveBeenCalled();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
  });

  it('does not skip untranslated rows after the current value leaves the empty filter', async () => {
    const rows = [0, 1, 2].map(index => ({ ...text, name: `Key-${index}`, value: '' }));
    const { page } = await render(LanguageTextsPage, {
      texts: {
        getList: vi.fn(async query => {
          const filtered = rows.filter(row => !query.getOnlyEmptyValues || !row.value);
          return {
            items: filtered.slice(
              query.skipCount ?? 0,
              (query.skipCount ?? 0) + (query.maxResultCount ?? 10),
            ),
            totalCount: filtered.length,
          };
        }),
        update: vi.fn(async (_resource, _culture, name, value) => {
          const row = rows.find(item => item.name === name);
          if (row) row.value = value;
        }),
      },
    });
    await page.get('#empty-values').setValue('true');
    await settle();
    await click('LanguageManagement::Edit');
    await page.get('#target-value').setValue('Translated');
    await click('LanguageManagement::SaveAndNext');
    expect(page.get('[role="dialog"] strong').text()).toBe('Key-1');
    await page.get('#target-value').setValue('Translated');
    await click('LanguageManagement::SaveAndNext');
    expect(page.get('[role="dialog"] strong').text()).toBe('Key-2');
  });

  it('restores inherited text through the dedicated restore endpoint', async () => {
    const { page, texts, refresh } = await render(LanguageTextsPage);
    await click('LanguageManagement::Edit');
    await click('LanguageManagement::RestoreToDefault');
    expect(texts.restoreToDefault).toHaveBeenCalledWith(
      'Example',
      'fr',
      'Greeting',
      expect.anything(),
    );
    expect(texts.update).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledOnce();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
  });

  it('keeps a failed restore open for retry', async () => {
    const restoreToDefault = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Unavailable'))
      .mockResolvedValueOnce(undefined);
    const { page } = await render(LanguageTextsPage, { texts: { restoreToDefault } });
    await click('LanguageManagement::Edit');
    await click('LanguageManagement::RestoreToDefault');
    expect(page.find('[role="dialog"]').exists()).toBe(true);
    await click('LanguageManagement::RestoreToDefault');
    expect(page.find('[role="dialog"]').exists()).toBe(false);
  });

  it('disables the module immediately when its feature is turned off', async () => {
    const { page, config } = await render(LanguageTextsPage);
    await click('LanguageManagement::Edit');
    config.setState({
      ...config.snapshot(),
      features: { values: { 'LanguageManagement.Enable': 'FALSE' } },
    });
    await settle();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
    expect(page.text()).toBe('');
  });
});
