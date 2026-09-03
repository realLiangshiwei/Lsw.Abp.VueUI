// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { ConfigStateService } from '../services/config-state.service.js';
import { LocalizationService } from '../services/localization.service.js';
import type { ApplicationConfigurationDto } from '../proxy/models.js';
import { HTTP_FETCH } from '../tokens/http.token.js';
import { provideAbpCore, withOptions } from '../providers/core.provider.js';
import type { Environment } from '../models/environment.js';
import { createAbpApp } from './vue-bridge.js';

const environment: Environment = {
  apis: { default: { url: '' } },
  application: { name: 'BookStore' },
  production: false,
};

const hostElement = () =>
  mount(defineComponent({ name: 'HostElement', render: () => h('div') })).element;

function withTexts(configState: ConfigStateService): void {
  configState.setState({
    ...configState.snapshot(),
    localization: {
      ...configState.snapshot().localization,
      resources: { AbpUi: { texts: { Save: 'Save', Welcome: 'Hei {0}' }, baseResources: [] } },
    },
  } as ApplicationConfigurationDto);
}

/** V4 of the milestone: where `$t` is available and what to use where it is not. */
describe('$t', () => {
  it('works straight from a template, interpolation included', async () => {
    // What a template compiles to; the runtime-only build has no template compiler.
    const Page = defineComponent({
      name: 'TemplatePage',
      render() {
        return h('span', `${this.$t('AbpUi::Save')} / ${this.$t('AbpUi::Welcome', 'Ada')}`);
      },
    });

    const app = await createAbpApp(Page, {
      providers: [
        provideAbpCore(withOptions({ environment, skipGetAppConfiguration: true })),
        { provide: HTTP_FETCH, useValue: () => Promise.resolve(new Response('{}')) },
      ],
    });
    withTexts(app.injector.get(ConfigStateService));

    const host = hostElement();
    app.mount(host);

    expect(host.textContent).toContain('Save / Hei Ada');
  });

  it('outside a template the service t() is used, with the injector held in a closure', async () => {
    const app = await createAbpApp(defineComponent({ name: 'PlainRoot', render: () => h('div') }), {
      providers: [
        provideAbpCore(withOptions({ environment, skipGetAppConfiguration: true })),
        { provide: HTTP_FETCH, useValue: () => Promise.resolve(new Response('{}')) },
      ],
    });
    withTexts(app.injector.get(ConfigStateService));

    // What an extension-system contributor callback does: it has no component and no
    // template, so it holds the injector and asks the service.
    const label = () => app.injector.get(LocalizationService).t('AbpUi::Save');

    expect(label()).toBe('Save');
  });
});
