# abpv create-lib

```bash
abpv create-lib Blogging
abpv create-lib Blogging --package @acme/blogging-vue --target packages/blogging
```

| | |
| --- | --- |
| `--package <name>` | npm package name; `abp-vue-<name>` by default |
| `--target <dir>` | Where to write it; `./<name>` by default |
| `--description <text>` | The package's description |
| `--template <dir>` | Render from this directory instead |
| `--dry-run` | Say what would be written and write nothing |

## What it writes

```
blogging/
├── src/                        the pages, the extension points, the routes
├── config/src/                 the menu entries and the permission names
├── proxy/src/                  where `abpv proxy add --target proxy/src` writes
├── vite.config.ts              self-contained: this is a repository of its own
├── vitest.config.ts
├── tsconfig*.json              four of them: type check, and one per entry point
└── scripts/                    the .vue declaration rewriter it needs at build time
```

The five extension points are wired up, so a host can add a column to your page without
touching your package. The example page talks to the backend through `RestService` so it
compiles before a proxy exists.

## Then

```bash
cd blogging && pnpm install && pnpm build
abpv proxy add --module blogging --target proxy/src
```

Rename what needs renaming: the component key is public API — a host replaces your page by
it — so pick it once.

## It is checked, not hoped for

CI packs the ABP Vue packages, runs `create-lib`, installs the result outside the
workspace, type checks it and builds it, and fails if a `.vue` specifier survived into a
published declaration. A scaffold nobody builds is a scaffold that is broken half the
time.
