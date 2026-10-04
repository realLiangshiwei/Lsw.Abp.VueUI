import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  provideAbpCore,
  withOptions,
  type Injector,
} from '@lsw-abpvue/core';
import PermissionButton from './PermissionButton.vue';

let wrapper: VueWrapper | undefined;
let injector: Injector | undefined;

afterEach(() => {
  wrapper?.unmount();
  injector?.destroy();
});

describe('PermissionButton', () => {
  it('updates the button when the granted policy changes', async () => {
    injector = createInjector([
      provideAbpCore(
        withOptions({
          environment: {
            production: false,
            application: { name: 'Test', baseUrl: 'http://localhost' },
            apis: { default: { url: 'http://localhost' } },
          },
        }),
      ),
    ]);
    const state = injector.get(ConfigStateService);
    wrapper = mount(PermissionButton, {
      global: { provide: { [ABP_INJECTOR_KEY]: injector } },
    });

    expect(wrapper.find('button').exists()).toBe(false);
    state.setState({
      ...state.snapshot(),
      auth: { grantedPolicies: { 'BookStore.Books.Create': true } },
    });
    await nextTick();
    expect(wrapper.get('button').text()).toBe('Create book');
  });
});
