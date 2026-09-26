import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type ApplicationConfigurationDto,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import { expectAccessiblePage, plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, type Component } from 'vue';
import SettingsPage from './SettingsPage.vue';

const mounted: VueWrapper[] = [];

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

function tab(label: string): Component {
  return defineComponent({ setup: () => () => h('p', label) });
}

function injectorWith(providers: ProviderInput[], policies: string[] = []): Injector {
  const injector = createInjector([...plainTheme.providers, ...providers]);
  const configState = injector.get(ConfigStateService);

  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: Object.fromEntries(policies.map(name => [name, true])) },
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

describe('SettingsPage', () => {
  it('says so when no tab survived the permission check', async () => {
    const injector = injectorWith([]);
    injector
      .get(SettingTabsService)
      .add([{ name: 'Locked', requiredPolicy: 'Nope', component: tab('locked') }]);

    const page = await render(SettingsPage, injector);

    expect(page.text()).toContain('AbpSettingManagement::NoSettingsAvailable');
    expect(page.findAll('[role="tab"]')).toHaveLength(0);
  });

  it('opens the first tab and switches to another', async () => {
    const injector = injectorWith([]);
    injector.get(SettingTabsService).add([
      { name: 'Second', order: 2, component: tab('second body') },
      { name: 'First', order: 1, component: tab('first body') },
    ]);

    const page = await render(SettingsPage, injector);
    const tabs = page.findAll('[role="tab"]');

    expect(tabs.map(button => button.text())).toEqual(['First', 'Second']);
    expect(page.text()).toContain('first body');

    await tabs[1]?.trigger('click');
    expect(page.text()).toContain('second body');
    expect(tabs[1]?.attributes('aria-selected')).toBe('true');
  });

  it('is accessible', async () => {
    const wrapper = await render(SettingsPage, injectorWith([]));

    await expectAccessiblePage(wrapper.element);
  });

  it('labels a tab by its text when it has one', async () => {
    const injector = injectorWith([]);
    injector
      .get(SettingTabsService)
      .add([{ name: 'Cms.Settings', text: 'AbpUi::Save', component: tab('body') }]);

    const page = await render(SettingsPage, injector);

    // The label goes through the real localizer, so what lands is the text, not the key.
    expect(page.find('[role="tab"]').text()).toContain('Save');
    expect(page.find('[role="tab"]').text()).not.toContain('Cms.Settings');
  });
});
