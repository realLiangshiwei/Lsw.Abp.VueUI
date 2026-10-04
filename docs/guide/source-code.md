# Owning the source

A module's UI is an npm package until you want it in your repository.

```bash
abpv add-package @lsw-abpvue/identity --with-source-code
abpv add-package all,@lsw-abpvue/theme-basic --with-source-code
abpv add-package --list-source-ready
```

The sources land in `packages/`, `tsconfig.json` gets a path that shadows the npm
package, and **not a single import in your application changes** — the package name stays
what it was, which is how the ABP CLI has released Angular sources all along.

```
your-app/
├── packages/identity/          the source, yours now
├── src/                        untouched: still imports @lsw-abpvue/identity
├── tsconfig.json               paths: { "@lsw-abpvue/identity": ["./packages/identity/src"] }
└── .abpvue/source-code.json    what was released, and at which version
```

## Install again afterwards

What the released package depended on becomes a dependency of your project. A package's
own dependencies live under that package, and released source no longer does — with
pnpm's layout, `packages/theme-basic` cannot see the `reka-ui` that
`node_modules/@lsw-abpvue/theme-basic` was installed with. npm and yarn's flat layout
would get away with it; pnpm will not, and being right on the strict one is what matters.

## What it costs

A released package stops following releases. `abpv update` says so rather than pretending
otherwise, and lists what was released at which version so you can bring fixes over by
hand. `abpv doctor` says it too, every run.

That is the trade: source you can read and change, against upgrades you now do yourself.
Release the one module you are actually customising, not all of them.

## Going back

Delete the directory under `packages/`, take its entry out of `tsconfig.json`'s `paths`
and any corresponding build aliases, and out of `.abpvue/source-code.json`, and install again. The npm package was never
removed from `dependencies` — the path only shadowed it — so there is nothing to put
back.
