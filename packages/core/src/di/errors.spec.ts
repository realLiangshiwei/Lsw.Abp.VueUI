import { describe, expect, it } from 'vitest';
import {
  CircularDependencyError,
  DuplicateFeatureError,
  InjectorDestroyedError,
  InvalidProviderError,
  MultiProviderMismatchError,
  NullInjectorError,
  OutsideInjectionContextError,
} from './errors';

const text = (error: Error) => `${error.name}: ${error.message}`;

describe('dependency injection error messages', () => {
  it('a missing provider gives the generic advice and the resolution path', () => {
    expect(
      text(
        new NullInjectorError({ description: 'RestService' }, [
          'ConfigStateService',
          'RestService',
        ]),
      ),
    ).toMatchInlineSnapshot(`
      "NullInjectorError: No provider for RestService.

        Nothing in the injector chain provides RestService, and it has no root default.
        Add it to createAbpApp({ providers: [...] }), usually through the provideXxx()
        helper of the package that owns it.

        Resolution path: ConfigStateService → RestService"
    `);
  });

  it('an abstract token replaces the generic advice with its own hint', () => {
    expect(
      text(
        new NullInjectorError(
          {
            description: 'AuthService',
            hint:
              'AuthService is an abstract token — it must be provided by an authentication package.\n' +
              '  Did you forget to add provideAbpOAuth() to createAbpApp({ providers: [...] })?',
          },
          ['ConfigStateService', 'RestService', 'ApiInterceptor', 'AuthService'],
        ),
      ),
    ).toMatchInlineSnapshot(`
      "NullInjectorError: No provider for AuthService.

        AuthService is an abstract token — it must be provided by an authentication package.
        Did you forget to add provideAbpOAuth() to createAbpApp({ providers: [...] })?

        Resolution path: ConfigStateService → RestService → ApiInterceptor → AuthService"
    `);
  });

  it('a circular dependency names the whole cycle', () => {
    expect(text(new CircularDependencyError(['A', 'B', 'A']))).toMatchInlineSnapshot(`
      "CircularDependencyError: Circular dependency: A → B → A.

        Break the cycle by resolving lazily: capture the injector in the factory with
        getCurrentInjector() and call injector.get() from inside the method that needs it."
    `);
  });

  it('outside an injection context it says where injection is possible', () => {
    expect(text(new OutsideInjectionContextError('inject(RestService)'))).toMatchInlineSnapshot(`
      "OutsideInjectionContextError: inject(RestService) was called outside an injection context.

        An injection context only exists synchronously inside:
          · a defineService / useFactory factory
          · a component's <script setup>
          · runInInjectionContext(injector, fn)

        If you are in an async function, capture the injector first:
          const injector = getCurrentInjector();
          await something();
          injector.get(RestService);"
    `);
  });

  it('an incomplete provider is told what it is missing', () => {
    expect(text(new InvalidProviderError('RestService'))).toMatchInlineSnapshot(`
      "InvalidProviderError: The provider for RestService has no useValue, useClass, useFactory or useExisting.

        A provider must say how to build the value, for example
        { provide: RestService, useFactory: () => ... }."
    `);
  });

  it('a destroyed injector says when it was destroyed', () => {
    expect(text(new InjectorDestroyedError('ListService'))).toMatchInlineSnapshot(`
      "InjectorDestroyedError: ListService was requested from an injector that is already destroyed.

        A component-level injector is destroyed when its component unmounts. In an async
        callback capture the service itself, not the injector it came from."
    `);
  });

  it('a multi mismatch reads differently in each direction', () => {
    expect(text(new MultiProviderMismatchError({ description: 'APP_INITIALIZERS', multi: true })))
      .toMatchInlineSnapshot(`
      "MultiProviderMismatchError: The provider for APP_INITIALIZERS does not match how the token was defined.

        APP_INITIALIZERS was defined with { multi: true }, so every provider for it must
        carry multi: true and contribute one element of the array."
    `);
    expect(
      text(new MultiProviderMismatchError({ description: 'LocalizationService', multi: false })),
    ).toMatchInlineSnapshot(`
      "MultiProviderMismatchError: The provider for LocalizationService does not match how the token was defined.

        LocalizationService is not a multi token, so a provider for it cannot carry
        multi: true. Define it with defineToken(..., { multi: true }) to collect values."
    `);
  });

  it('a repeated feature is named in the error', () => {
    expect(text(new DuplicateFeatureError('provideAbpCore()', 'withOptions')))
      .toMatchInlineSnapshot(`
      "DuplicateFeatureError: provideAbpCore() received more than one withOptions feature.

        The last one would silently win. Pass it once, merging the options into a single call."
    `);
  });
});
