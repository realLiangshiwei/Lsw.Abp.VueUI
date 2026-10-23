import {
  APP_INITIALIZERS,
  ConfigStateService,
  createInjector,
  RoutesService,
  type Injector,
} from '@lsw-abpvue/core';
import { afterEach, describe, expect, it } from 'vitest';
import { languageManagementGuard } from '../../src/guards/language-management.guard.js';
import { createLanguageManagementRoutes } from '../../src/routes.js';
import {
  LanguageManagementPolicyNames as Policy,
  LanguageManagementRouteNames as Names,
} from './enums/route-names.js';
import { provideLanguageManagementConfig } from './providers/language-management-config.provider.js';

const injectors: Injector[] = [];
afterEach(() => injectors.splice(0).forEach(injector => injector.destroy()));

function start() {
  const injector = createInjector([provideLanguageManagementConfig()]);
  injectors.push(injector);
  for (const initialize of injector.get(APP_INITIALIZERS, [], { optional: true }))
    injector.runInContext(initialize);
  return injector;
}

describe('language management navigation', () => {
  it('registers the official route names, paths and independent policies', () => {
    const routes = start().get(RoutesService).flat.value;
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: Names.LanguageManagement,
          path: '/language-management',
          parentName: 'AbpUiNavigation::Menu:Administration',
          requiredPolicy: Policy.LanguageManagement,
          order: 4,
        }),
        expect.objectContaining({
          name: Names.Languages,
          path: '/language-management/languages',
          requiredPolicy: Policy.Languages,
        }),
        expect.objectContaining({
          name: Names.LanguageTexts,
          path: '/language-management/texts',
          requiredPolicy: Policy.LanguageTexts,
        }),
      ]),
    );
  });

  it('hides navigation and rejects direct access when its feature is disabled', () => {
    const injector = start();
    const config = injector.get(ConfigStateService);
    expect(injector.runInContext(languageManagementGuard)).toBe(true);
    config.setState({
      ...config.snapshot(),
      features: { values: { 'LanguageManagement.Enable': 'FALSE' } },
    });
    expect(injector.runInContext(languageManagementGuard)).toBe(false);
    expect(
      injector.get(RoutesService).flat.value.find(route => route.name === Names.LanguageManagement)
        ?.invisible,
    ).toBe(true);
    config.setState({
      ...config.snapshot(),
      features: { values: { 'LanguageManagement.Enable': 'true' } },
    });
    expect(injector.runInContext(languageManagementGuard)).toBe(true);
    expect(
      injector.get(RoutesService).flat.value.find(route => route.name === Names.LanguageManagement)
        ?.invisible,
    ).toBe(false);
  });

  it('exposes both replaceable pages behind their own policies', () => {
    const root = createLanguageManagementRoutes()[0];
    expect(root?.meta?.requiresAuthentication).toBe(true);
    expect(root?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'languages',
          meta: expect.objectContaining({
            requiredPolicy: Policy.Languages,
            replaceableComponent: expect.objectContaining({
              key: 'LanguageManagement.LanguagesComponent',
            }),
          }),
        }),
        expect.objectContaining({
          path: 'texts',
          meta: expect.objectContaining({
            requiredPolicy: Policy.LanguageTexts,
            replaceableComponent: expect.objectContaining({
              key: 'LanguageManagement.LanguageTextsComponent',
            }),
          }),
        }),
      ]),
    );
  });
});
