# Upgrading

Keep the CLI and all `@lsw-abpvue/*` runtime packages on one release version. Read the target release notes and preview the manifest changes first.

```bash
pnpm abpv update --dry-run
pnpm abpv update
pnpm install
```

Use `--to <version>` for an exact target. The command's default tag is `latest`, which selects the stable release. Select a prerelease channel explicitly with `--tag alpha`, `--tag beta` or `--tag rc` when needed.

## What changes

The CLI updates plain semver ranges while keeping their modifier. Tags, `file:` dependencies and Git URLs are left as chosen. Any registered migrations execute in version order.

Released local source is listed with newer changelog notes, but its files and recorded source version are not overwritten. Review and merge those fixes yourself. [Source ownership](/guide/source-code) explains this boundary.

## After installing

Run type checking, build and relevant application tests. Check login, logout and My account if authentication changed. Refresh business proxies when the backend API changes, then review the resulting diff before regenerating a page.

A generated business page belongs to the application. Upgrading framework packages does not silently replace it. `generate --force` is an explicit whole-page replacement.
