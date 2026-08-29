/**
 * Base class of every dependency-injection failure.
 *
 * A bare token name is rarely enough to find the provider that should have been
 * registered, so every message carries the resolution path that led to the failing
 * token and at least one suggestion for fixing it.
 */
export class AbpDiError extends Error {
  constructor(
    name: string,
    message: string,
    readonly resolutionPath: readonly string[] = [],
  ) {
    super(
      resolutionPath.length > 0
        ? `${message}\n\n  Resolution path: ${resolutionPath.join(' → ')}`
        : message,
    );
    this.name = name;
  }
}

/** Shape of the parts of a token an error needs, so `errors` stays free of imports. */
interface TokenLike {
  readonly description: string;
  readonly hint?: string | undefined;
}

function defaultHint(description: string): string {
  return (
    `Nothing in the injector chain provides ${description}, and it has no root default.\n` +
    `  Add it to createAbpApp({ providers: [...] }), usually through the provideXxx()\n` +
    `  helper of the package that owns it.`
  );
}

/** Thrown when a token reaches the end of the injector chain unresolved. */
export class NullInjectorError extends AbpDiError {
  constructor(token: TokenLike, resolutionPath: readonly string[] = []) {
    super(
      'NullInjectorError',
      `No provider for ${token.description}.\n\n  ${token.hint ?? defaultHint(token.description)}`,
      resolutionPath,
    );
  }
}

/** Thrown when a factory injects a token whose factory injects it back. */
export class CircularDependencyError extends AbpDiError {
  constructor(cycle: readonly string[]) {
    super(
      'CircularDependencyError',
      `Circular dependency: ${cycle.join(' → ')}.\n\n` +
        `  Break the cycle by resolving lazily: capture the injector in the factory with\n` +
        `  getCurrentInjector() and call injector.get() from inside the method that needs it.`,
    );
  }
}

/**
 * Thrown when `inject()` and friends run where no injector is reachable — most often
 * after an `await`, which is where the injection context is lost.
 */
export class OutsideInjectionContextError extends AbpDiError {
  constructor(subject: string) {
    super(
      'OutsideInjectionContextError',
      `${subject} was called outside an injection context.\n\n` +
        `  An injection context only exists synchronously inside:\n` +
        `    · a defineService / useFactory factory\n` +
        `    · a component's <script setup>\n` +
        `    · runInInjectionContext(injector, fn)\n\n` +
        `  If you are in an async function, capture the injector first:\n` +
        `    const injector = getCurrentInjector();\n` +
        `    await something();\n` +
        `    injector.get(RestService);`,
    );
  }
}

/** Thrown when a provider says which token it is for but not how to build the value. */
export class InvalidProviderError extends AbpDiError {
  constructor(description: string) {
    super(
      'InvalidProviderError',
      `The provider for ${description} has no useValue, useClass, useFactory or useExisting.\n\n` +
        `  A provider must say how to build the value, for example\n` +
        `  { provide: ${description}, useFactory: () => ... }.`,
    );
  }
}

/** Thrown when a service is requested from an injector that has already been torn down. */
export class InjectorDestroyedError extends AbpDiError {
  constructor(description: string) {
    super(
      'InjectorDestroyedError',
      `${description} was requested from an injector that is already destroyed.\n\n` +
        `  A component-level injector is destroyed when its component unmounts. In an async\n` +
        `  callback capture the service itself, not the injector it came from.`,
    );
  }
}

/** Thrown when the same non-repeatable `withXxx()` feature is passed twice. */
export class DuplicateFeatureError extends AbpDiError {
  constructor(source: string, kind: string) {
    super(
      'DuplicateFeatureError',
      `${source} received more than one ${kind} feature.\n\n` +
        `  The last one would silently win. Pass it once, merging the options into a single call.`,
    );
  }
}

/** Thrown when a provider and its token disagree about being a multi token. */
export class MultiProviderMismatchError extends AbpDiError {
  constructor(token: { description: string; multi: boolean }) {
    super(
      'MultiProviderMismatchError',
      `The provider for ${token.description} does not match how the token was defined.\n\n` +
        (token.multi
          ? `  ${token.description} was defined with { multi: true }, so every provider for it must\n` +
            `  carry multi: true and contribute one element of the array.`
          : `  ${token.description} is not a multi token, so a provider for it cannot carry\n` +
            `  multi: true. Define it with defineToken(..., { multi: true }) to collect values.`),
    );
  }
}
