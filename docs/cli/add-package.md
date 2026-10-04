# abpv add-package

```bash
abpv add-package @lsw-abpvue/identity
abpv add-package @lsw-abpvue/identity --with-source-code
abpv add-package all,@lsw-abpvue/theme-basic --with-source-code
abpv add-package --list-source-ready
```

| | |
| --- | --- |
| `--with-source-code` | Release the package's source into `packages/` |
| `--list-source-ready` | Which packages can be released |
| `--dry-run` | Say what it would do |

`all` is a word in the list, not a replacement for it: `all,@lsw-abpvue/theme-basic`
releases every module UI **and** the theme.

## What a release does

The sources land in `packages/`, `tsconfig.json` gets a path that shadows the npm
package, and no import in your application changes. What the released package depended on
becomes a dependency of the project — its own `node_modules` is no longer on the path —
so install again afterwards.

`.abpvue/source-code.json` records what was released and at which version. `abpv update`
and `abpv doctor` both read it and say those packages no longer follow releases.

## abpv eject

The same thing under the name people look for. It is an alias.

Installing a package does not register its menu and routes; follow its [module guide](/modules/).
