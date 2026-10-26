import {
  APP_INITIALIZERS,
  ConfigStateService,
  createInjector,
  RoutesService,
} from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { computed, ref } from 'vue';
import { textTemplateManagementGuard } from '../../src/guards/text-template-management.guard.js';
import { createTextTemplateManagementRoutes } from '../../src/routes.js';
import {
  TextTemplateManagementPolicyNames as Policy,
  TextTemplateManagementRouteNames as Names,
  provideTextTemplateManagementConfig,
  TEXT_TEMPLATE_MANAGEMENT_FEATURES,
} from './index.js';

describe('text template navigation', () => {
  it('lets the host override feature availability for both navigation and direct access', () => {
    const enabled = ref(false);
    const injector = createInjector([
      provideTextTemplateManagementConfig(),
      {
        provide: TEXT_TEMPLATE_MANAGEMENT_FEATURES,
        useValue: computed(() => ({ enable: enabled.value })),
      },
    ]);
    try {
      for (const initialize of injector.get(APP_INITIALIZERS, [], { optional: true }))
        injector.runInContext(initialize);
      const routes = injector.get(RoutesService);
      for (const value of [false, true]) {
        enabled.value = value;
        expect(injector.runInContext(textTemplateManagementGuard)).toBe(value);
        expect(routes.flat.value.find(route => route.name === Names.TextTemplates)?.invisible).toBe(
          !value,
        );
      }
    } finally {
      injector.destroy();
    }
  });

  it('registers the official menu and follows the exact feature key reactively', () => {
    const injector = createInjector([provideTextTemplateManagementConfig()]);
    try {
      for (const initialize of injector.get(APP_INITIALIZERS, [], { optional: true }))
        injector.runInContext(initialize);
      const routes = injector.get(RoutesService);
      expect(routes.flat.value).toContainEqual(
        expect.objectContaining({
          name: Names.TextTemplates,
          path: '/text-template-management/text-templates',
          parentName: 'AbpUiNavigation::Menu:Administration',
          requiredPolicy: Policy.TextTemplates,
          order: 6,
        }),
      );
      const config = injector.get(ConfigStateService);
      for (const [value, enabled] of [
        ['FALSE', false],
        ['true', true],
      ] as const) {
        config.setState({
          ...config.snapshot(),
          features: { values: { 'TextManagement.Enable': value } },
        });
        expect(injector.runInContext(textTemplateManagementGuard)).toBe(enabled);
        expect(routes.flat.value.find(route => route.name === Names.TextTemplates)?.invisible).toBe(
          !enabled,
        );
      }
    } finally {
      injector.destroy();
    }
  });

  it('exposes all three exact replaceable keys behind list and content policies', () => {
    const root = createTextTemplateManagementRoutes()[0];
    expect(root?.children?.[0]?.redirect).toBe('/text-template-management/text-templates');
    const list = root?.children?.[1];
    expect(list?.meta).toMatchObject({
      requiresAuthentication: true,
      requiredPolicy: Policy.TextTemplates,
    });
    expect(list?.children?.[0]?.meta?.replaceableComponent?.key).toBe(
      'TextTemplateManagement.TextTemplates',
    );
    const contents = list?.children?.[1];
    expect(contents?.meta?.requiredPolicy).toBe(Policy.EditContents);
    expect(
      contents?.children?.map(route => [route.path, route.meta?.replaceableComponent?.key]),
    ).toEqual([
      ['inline/:name', 'TextTemplateManagement.InlineTemplateContent'],
      [':name', 'TextTemplateManagement.TemplateContents'],
    ]);
  });
});
