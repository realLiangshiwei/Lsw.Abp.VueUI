# Dependency injection

The extension system needs an injector that plain callbacks — not components — can reach,
and Vue's `provide`/`inject` alone does not offer one. So there is a small kernel: typed
tokens, hierarchical resolution, multi-providers, and an injector object a callback can
hold on to.

## Defining a service

```ts
export const BookService = defineService('BookService', () => {
  const rest = inject(RestService);

  return {
    getList: (input: PagedAndSortedResultRequestDto) =>
      rest.request<never, PagedResultDto<BookDto>>({ method: 'GET', url: '/api/app/book' }),
  };
});

export type BookService = ServiceOf<typeof BookService>;
```

Four lines of ceremony and no decorators: no `reflect-metadata`, no `emitDecoratorMetadata`,
nothing that a bundler has to be told about. The factory runs once per injector, and its
return value is the service.

::: warning
A factory must not have side effects — no requests, no DOM. Something that has to happen
at startup goes in `provideAppInitializer`, which runs after the injector is built and
can be awaited.
:::

## Using one

```ts
const books = inject(BookService);        // inside setup(), or another factory
const books = injector.get(BookService);  // anywhere, given an injector
```

`inject()` outside an injection context throws with the resolution path in the message,
rather than returning undefined for someone to trip over later.

## Replacing one

```ts
createAbpApp(App, {
  providers: [
    provideAbpCore(withOptions({ environment })),
    { provide: BookService, useClass: MyBookService },
  ],
});
```

`useValue`, `useFactory`, `useClass` and `useExisting`, as in Angular. A token declared
with `multi: true` collects every provider for it into an array — that is how HTTP
interceptors, error handlers and localization contributors are registered.

## Overriding one for a page

```ts
provideAbp([{ provide: BookService, useValue: fakeBooks }]);
```

Called in a component's `setup()`, it establishes a child injector for that component's
subtree. The component tree is the injector tree, which is what makes a page's extension
identifier resolvable by the buttons inside it.

::: tip
An `inject()` after `provideAbp` in the same `setup()` still sees the parent injector.
The returned injector is what the page's own callbacks resolve through.
:::

## Tokens

```ts
export const HTTP_INTERCEPTORS = defineToken<HttpInterceptor[]>('HTTP_INTERCEPTORS', {
  multi: true,
});
```

A token is a symbol carrying a type, so two packages cannot collide and a wrong value
does not compile. This is also why every package in this UI depends on its siblings
through `peerDependencies`: two physical copies of `@lsw-abpvue/core` mean two symbols,
and injection stops working in a way that is very hard to see.

## Where it differs from Angular

| Angular | Here |
| --- | --- |
| `@Injectable()` and decorators | `defineService(name, factory)` |
| `providedIn: 'root'` | Provided where the application is created |
| `InjectionToken` | `defineToken`, same idea |
| `inject()` | `inject()`, same name and same rules |
| A component-level `providers: []` | `provideAbp([...])` in `setup()` |
| Errors surface at runtime | `MultiProviderMismatchError`, `DuplicateFeatureError` and `InjectorDestroyedError` are thrown where the mistake is |
