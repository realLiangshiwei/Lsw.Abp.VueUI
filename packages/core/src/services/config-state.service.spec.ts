import { describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import configurationFixture from '../../../../e2e/fixtures/application-configuration.json';
import { createInjector } from '../di/injector';
import type { ApplicationConfigurationDto } from '../proxy/models';
import { HTTP_FETCH, type FetchLike } from '../tokens/http.token';
import { ConfigStateService } from './config-state.service';

/** The real answer of a running ABP backend, captured by `scripts/capture-fixtures.sh`. */
const fixture = configurationFixture as unknown as ApplicationConfigurationDto;

const json = (body: unknown) => new Response(JSON.stringify(body));

function configState(responder: FetchLike = () => Promise.resolve(json(fixture))) {
  return createInjector([{ provide: HTTP_FETCH, useValue: responder }]).get(ConfigStateService);
}

describe('before the configuration arrives', () => {
  it('every node is there, so reading down does not throw', () => {
    const state = configState();

    expect(state.snapshot().currentUser.isAuthenticated).toBe(false);
    expect(state.getOne('auth').value.grantedPolicies).toEqual({});
    expect(state.getDeep('localization.currentCulture.cultureName').value).toBeUndefined();
  });
});

describe('reading the configuration', () => {
  it('reads a top-level key', async () => {
    const state = configState();
    await state.refreshAppState();

    expect(state.getOne('currentTenant').value).toEqual({
      id: null,
      name: null,
      isAvailable: false,
    });
    expect(state.getOne('currentUser').value.isAuthenticated).toBe(false);
  });

  it('reads down a path', async () => {
    const state = configState();
    await state.refreshAppState();

    expect(state.getDeep('localization.currentCulture.cultureName').value).toBe('en');
    expect(state.getDeep(['clock', 'kind']).value).toBe('Unspecified');
  });

  it('a path that breaks halfway is undefined rather than a throw', async () => {
    const state = configState();
    await state.refreshAppState();

    expect(state.getDeep('nope.not.here').value).toBeUndefined();
  });

  it('reads a setting by name and filters by keyword', async () => {
    const state = configState();
    await state.refreshAppState();

    expect(state.getSetting('Abp.Localization.DefaultLanguage').value).toBe('en');
    expect(Object.keys(state.getSettings('Abp.Localization').value).length).toBeGreaterThan(0);
    expect(
      Object.keys(state.getSettings('Abp.Localization').value).every(key =>
        key.startsWith('Abp.Localization'),
      ),
    ).toBe(true);
  });

  it('reads a feature by name, and true as a string is on', async () => {
    const state = configState();
    await state.refreshAppState();

    expect(state.getFeature('SettingManagement.Enable').value).toBe('true');
    expect(state.getFeatureIsEnabled('SettingManagement.Enable').value).toBe(true);
    expect(state.getFeatureIsEnabled('SettingManagement.Nope').value).toBe(false);
    expect(state.getGlobalFeatureIsEnabled('Nope').value).toBe(false);
  });

  it('a filtered set of settings keeps its reference while the content is the same', async () => {
    const state = configState();
    await state.refreshAppState();
    const settings = state.getSettings('Abp.Localization');
    const first = settings.value;

    state.setState({ ...state.snapshot(), extraProperties: { touched: true } });

    expect(settings.value).toBe(first);
  });
});

describe('refreshing the configuration', () => {
  it('after a refresh the state is what the backend sent', async () => {
    const state = configState();

    await expect(state.refreshAppState()).resolves.toMatchObject({
      localization: { defaultResourceName: 'BookStore' },
    });
    expect(state.getOne('setting').value.values['Abp.Localization.DefaultLanguage']).toBe('en');
  });

  it('does not ask the backend for the texts along with the configuration', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(json(fixture)));
    await configState(send).refreshAppState();

    expect(send.mock.calls[0]?.[0]).toContain('includeLocalizationResources=false');
  });

  it('the earlier of two overlapping refreshes is abandoned, and the last one wins', async () => {
    const bodies = [
      { ...fixture, extraProperties: { round: 'first' } },
      { ...fixture, extraProperties: { round: 'second' } },
    ];
    let call = 0;
    const state = configState(async (_url, init) => {
      const body = bodies[call++];
      await new Promise(resolve => setTimeout(resolve, call === 1 ? 20 : 0));
      if (init?.signal?.aborted) throw new DOMException('aborted', 'AbortError');
      return json(body);
    });

    const [first, second] = await Promise.all([state.refreshAppState(), state.refreshAppState()]);

    expect(second.extraProperties).toEqual({ round: 'second' });
    expect(first.extraProperties).toEqual({ round: 'second' });
    expect(state.snapshot().extraProperties).toEqual({ round: 'second' });
  });

  it('the texts are fetched on their own, filling in resources and values', async () => {
    const state = configState(url =>
      Promise.resolve(
        String(url).includes('application-localization')
          ? json({
              resources: { BookStore: { texts: { Menu: 'Menu' }, baseResources: [] } },
              currentCulture: { cultureName: 'en', isRightToLeft: false, dateTimeFormat: {} },
            })
          : json(fixture),
      ),
    );

    await state.refreshLocalization('en');

    expect(state.snapshot().localization.values.BookStore).toEqual({ Menu: 'Menu' });
    expect(state.snapshot().localization.resources.BookStore?.baseResources).toEqual([]);
  });
});

/**
 * V3 of the milestone: what a `computed` over a deep field of a large configuration
 * costs. Nothing is deep-compared — the configuration is replaced whole, so a slice's
 * cost is one selector run per refresh, and downstream work only happens when the
 * selected value itself changed.
 */
describe('recomputation cost on a large configuration', () => {
  it('one refresh runs each slice selector once, whatever the size of the configuration', async () => {
    const state = configState();
    await state.refreshAppState();
    const selector = vi.fn((configuration: ApplicationConfigurationDto) => configuration.setting);
    const slice = state.getAll();
    void slice.value;

    const watched = computed(() => selector(state.getAll().value));
    void watched.value;

    state.setState({ ...state.snapshot() });
    void watched.value;
    void watched.value;
    void watched.value;

    expect(selector).toHaveBeenCalledTimes(2);
  });

  it('a field whose value did not change does not disturb what reads it', async () => {
    const state = configState();
    await state.refreshAppState();
    const culture = state.getDeep<string>('localization.currentCulture.cultureName');
    const derived = vi.fn(() => culture.value.toUpperCase());
    const upper = computed(derived);
    expect(upper.value).toBe('EN');

    // A refresh allocates a whole new configuration object, as the real one does.
    state.setState(structuredClone(state.snapshot()));

    expect(upper.value).toBe('EN');
    expect(derived).toHaveBeenCalledOnce();
  });
});
