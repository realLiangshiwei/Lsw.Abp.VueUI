# abpv eject

`eject` is an alias for `add-package --with-source-code`:

```bash
abpv eject @lsw-abpvue/identity --dry-run
abpv eject @lsw-abpvue/identity
```

It copies a source-ready package into the application's `packages/`, adds source resolution and records its version in `.abpvue/source-code.json`. Install dependencies again after the operation.

The local copy becomes yours to maintain. `update` does not overwrite it. See [add-package](./add-package) for package lists and options and [working with source](/guide/source-code) for returning to npm packages.
