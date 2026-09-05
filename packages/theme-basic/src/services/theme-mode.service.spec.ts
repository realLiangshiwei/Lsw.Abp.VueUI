import { createInjector, DocumentService, StorageService } from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { ThemeModeService } from './theme-mode.service.js';

const create = () => {
  const injector = createInjector([]);
  return { injector, themeMode: injector.get(ThemeModeService) };
};

describe('ThemeModeService', () => {
  it('follows the system until it is told otherwise', () => {
    const { themeMode } = create();

    expect(themeMode.mode.value).toBe('system');
  });

  it('writes the choice onto the document, where Bootstrap reads it', () => {
    const { injector, themeMode } = create();
    themeMode.init();

    themeMode.set('dark');

    expect(
      injector.get(DocumentService).nativeDocument?.documentElement.getAttribute('data-bs-theme'),
    ).toBe('dark');
  });

  it('remembers the choice across a reload', () => {
    const first = create();
    first.themeMode.set('dark');

    expect(first.injector.get(StorageService).getItem('abpThemeBasicMode')).toBe('dark');
    expect(create().themeMode.mode.value).toBe('dark');
  });

  it('toggles from whatever is on screen to the other one', () => {
    const { themeMode } = create();
    themeMode.set('light');

    themeMode.toggle();

    expect(themeMode.resolved.value).toBe('dark');
  });
});
