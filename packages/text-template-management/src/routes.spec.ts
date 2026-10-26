import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  inject,
  ReplaceableComponentsService,
} from '@lsw-abpvue/core';
import { permissionGuard } from '@lsw-abpvue/core/router';
import { TextTemplateManagementPolicyNames as Policy } from '@lsw-abpvue/text-template-management/config';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import { TextTemplateManagementComponents as Keys } from './enums/components.js';
import { createTextTemplateManagementRoutes } from './routes.js';
import {
  TEXT_TEMPLATE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
  type TextTemplateManagementConfigOptions,
} from './tokens/extensions.token.js';

describe('text template page replacement', () => {
  it('replaces every official page and preserves its route contributions', async () => {
    const options: TextTemplateManagementConfigOptions = {
      entityPropContributors: { [Keys.TextTemplates]: [] },
    };
    const injector = createInjector([]);
    const config = injector.get(ConfigStateService);
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { [Policy.TextTemplates]: true, [Policy.EditContents]: true } },
    });
    const replacements = injector.get(ReplaceableComponentsService);
    for (const key of Object.values(Keys)) {
      replacements.add({
        key,
        component: defineComponent({
          setup() {
            const contributions = inject(TEXT_TEMPLATE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS);
            return () => h('p', `${key}: ${contributions === options.entityPropContributors}`);
          },
        }),
      });
    }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: defineComponent({ render: () => null }) },
        ...createTextTemplateManagementRoutes(options),
      ],
    });
    router.beforeEach(permissionGuard);
    const view = mount(defineComponent({ render: () => h(RouterView) }), {
      global: { plugins: [router], provide: { [ABP_INJECTOR_KEY]: injector } },
    });
    try {
      for (const [path, key] of [
        ['', Keys.TextTemplates],
        ['/contents/inline/Example', Keys.InlineTemplateContent],
        ['/contents/Example', Keys.TemplateContents],
      ] as const) {
        await router.push(`/text-template-management/text-templates${path}`);
        await flushPromises();
        expect(view.text()).toBe(`${key}: true`);
      }
      await router.push('/');
      config.setState({
        ...config.snapshot(),
        features: { values: { 'TextManagement.Enable': 'false' } },
      });
      await router.push('/text-template-management/text-templates');
      await flushPromises();
      expect(view.text()).toBe('');
    } finally {
      view.unmount();
      injector.destroy();
    }
  });
});
