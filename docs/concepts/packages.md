# Package layout

Every package depends on its siblings through `peerDependencies`, and there is a reason
beyond tidiness: the DI tokens are symbols, and two physical copies of
`@lsw-abpvue/core` in a tree mean two different symbols for the same service. Injection
then fails in a way that is very hard to see.

## The layers

| Package | May depend on |
| --- | --- |
| `utils` | nothing |
| `core` | `vue`, `vue-router` (peer), `utils` |
| `oauth` | `core`, `oidc-client-ts` |
| `theme-shared` | **`core` only.** No UI library, not even reka-ui |
| `components` | `core`, `theme-shared` (peer), `@tanstack/vue-table` |
| `theme-basic` | `theme-shared`, `account-core`, `reka-ui`, its `@internationalized/date` companion, Bootstrap's CSS |
| Module UIs | the layers above, and each other; **never a theme implementation** |

## Secondary entry points

```
@lsw-abpvue/identity          the pages, lazily
@lsw-abpvue/identity/config   the menu entries, at startup
@lsw-abpvue/identity/proxy    the generated services
```

Three entry points because the three are needed at different times. Identity config registers navigation without loading its pages. Other config entries can include lazy tab components, so inspect the package entry when deciding what to load.

`abpv create-lib` writes a package with the same three, for a module of your own.

`@lsw-abpvue/core/object-extensions` is a pure mapping entry point with no Vue or DI
imports. Runtime components and the Node CLI share it, so diagnostics use the same
property mapping as the controls.

## What a consumer needs

ESM only, `"type": "module"`, declarations built by `vue-tsc`. `moduleResolution` of
`bundler`, `node16` or `nodenext` all resolve — which is checked in CI by installing the
packed tarballs into a project outside the workspace and compiling against them.

## SSR discipline

`core` never touches `window`, `document` or `localStorage` directly: everything goes
through `WindowService`, `DocumentService`, `StorageService` and `CookieService`, and
singleton state lives on a service instance rather than in a module-level variable. There
is no server-side renderer yet; this is what keeps one possible.
