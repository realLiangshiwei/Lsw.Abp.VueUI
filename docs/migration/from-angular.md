# Migrate from Angular

Backend DTO fields, localization keys, policy names and replaceable component keys follow Angular conventions. Vue's runtime API is different, so migrate behavior with the same backend contract and adapt component code.

## State and requests

`ConfigStateService.getOne` and `getDeep` return computed refs. `.value` reads the current snapshot; Vue templates unwrap them and `watch` or `computed` responds to changes. REST and generated services return promises. Cancellation uses `AbortSignal` instead of unsubscribing.

DI uses typed symbols and factories rather than decorators. Capture injected services before an asynchronous boundary. `provideAbp` supplies a child injector for descendants; use its returned injector to read an override in the same setup.

## Pages and contributors

Application business pages use explicit columns, forms and CRUD methods. Reusable module pages retain the five extension points. Keep component identifiers, but adapt Observable-returning callbacks to Promise or Ref and replace Angular component classes with Vue components.

A `valueResolver` returns display text; rich cells use a Vue component or scoped slot. Avoid carrying HTML-producing resolver strings into text cells.

## Move gradually

1. Run `switch-ui --mode keep` to add Vue beside the existing Angular frontend.
2. Generate your application proxies with `proxy add --module app`; use package proxies for built-in modules.
3. Register startup configuration and lazy module routes.
4. Move business pages and adapt reusable module contributors.
5. Check login, My account, logout, permissions, tenant behavior and direct links.
6. Remove the old UI only after your application's migration is complete.

Commercial module UIs and unsupported backend operations need separate implementations. See [API mapping](./api-map) and [compatibility](/release/compatibility).
