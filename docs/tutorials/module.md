# Create a reusable module

A reusable module serves multiple host applications, so it publishes configuration, lazy routes, typed proxies and page extension points.

## 1. Scaffold the package

```bash
abpv create-lib Blogging --package @acme/blogging-vue --target packages/blogging
cd packages/blogging
pnpm install
pnpm typecheck
pnpm build
```

The generated package is self-contained, with main, config and proxy entry points. Inspect its exported provider and route names before wiring it into a host. Its example page demonstrates the five extension points and uses `RestService` until you generate a backend proxy.

## 2. Connect the backend

With your ABP module running, generate its proxy:

```bash
abpv proxy add --module blogging --target proxy/src
```

Adapt the page's methods and DTOs to the module endpoints. Confirm that declared package exports include the generated proxy's public entry.

## 3. Integrate a host

Register the package's lightweight configuration provider at startup. Load its route factory with `lazyRoutes` and pass host contributors there. Choose stable component keys and localization resource names before other applications depend on them.

## 4. Publishable boundaries

Use theme-shared controls so the module works with the selected theme. Depend on shared ABP Vue packages through peer dependencies to keep one DI token instance. Include declaration files and public entry points in the package, then type check and build an external host consuming the packed archive.

See [create-lib](/cli/create-lib) for the scaffold layout and [extensions](/concepts/extensions) for contributor semantics.
