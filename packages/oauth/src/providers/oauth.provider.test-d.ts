import {
  ConfigStateService,
  defineToken,
  MemoryTokenStorage,
  ServerTokenStorage,
  type EnvironmentProviders,
  type TokenStorage,
} from '@lsw-abpvue/core';
import { describe, expectTypeOf, it } from 'vitest';
import { provideAbpOAuth, withTokenStorage, type OAuthFeature } from './oauth.provider';

/** A host's own implementation, reached through a token of its own. */
const WorkerTokenStorage = defineToken<TokenStorage>('WorkerTokenStorage');

describe('provideAbpOAuth', () => {
  it('produces the kind of provider only createAbpApp takes', () => {
    expectTypeOf(provideAbpOAuth()).toEqualTypeOf<EnvironmentProviders>();
    expectTypeOf(
      provideAbpOAuth(withTokenStorage(MemoryTokenStorage)),
    ).toEqualTypeOf<EnvironmentProviders>();
  });

  it('takes only its own features', () => {
    expectTypeOf(withTokenStorage(MemoryTokenStorage)).toMatchTypeOf<OAuthFeature>();

    // @ts-expect-error a feature of another package is not one of ours
    provideAbpOAuth(defineToken<string>('NotAFeature'));
  });
});

describe('withTokenStorage', () => {
  it('accepts the three implementations in core and a token of the host own making', () => {
    expectTypeOf(withTokenStorage(MemoryTokenStorage)).toMatchTypeOf<OAuthFeature>();
    expectTypeOf(withTokenStorage(ServerTokenStorage)).toMatchTypeOf<OAuthFeature>();
    expectTypeOf(withTokenStorage(WorkerTokenStorage)).toMatchTypeOf<OAuthFeature>();
  });

  it('a token that is not a storage is refused on the spot -- passing a service by mistake is easy', () => {
    // @ts-expect-error ConfigStateService is not a TokenStorage
    withTokenStorage(ConfigStateService);
  });

  it('an implementation missing methods is refused too', () => {
    const Incomplete = defineToken<{ getItem(key: string): string | null }>('Incomplete');

    // @ts-expect-error a storage that cannot write or enumerate is not a TokenStorage
    withTokenStorage(Incomplete);
  });
});
