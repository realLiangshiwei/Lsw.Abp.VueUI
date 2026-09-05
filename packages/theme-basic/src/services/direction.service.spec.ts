import { ConfigStateService, createInjector, DocumentService } from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { DirectionService } from './direction.service.js';

function withCulture(rightToLeft: boolean) {
  const injector = createInjector([]);
  const configState = injector.get(ConfigStateService);
  const snapshot = configState.snapshot();

  configState.setState({
    ...snapshot,
    localization: {
      ...snapshot.localization,
      currentCulture: { ...snapshot.localization.currentCulture, isRightToLeft: rightToLeft },
    },
  });

  return injector;
}

const dir = (injector: ReturnType<typeof createInjector>) =>
  injector.get(DocumentService).nativeDocument?.documentElement.getAttribute('dir');

describe('DirectionService', () => {
  it('reads the direction off the current culture', () => {
    expect(withCulture(true).get(DirectionService).direction.value).toBe('rtl');
    expect(withCulture(false).get(DirectionService).direction.value).toBe('ltr');
  });

  it('puts it on the document, which is what the layout reads', () => {
    const injector = withCulture(true);

    injector.get(DirectionService).init();

    expect(dir(injector)).toBe('rtl');
  });
});
