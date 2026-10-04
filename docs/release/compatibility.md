# Versions and compatibility

This site is built from `main`. It documents the source currently in that branch; it is not a frozen manual for every previously published alpha.

## Published packages

The current release line is `0.0.1-alpha.5`, installed with the `alpha` dist-tag. All public ABP Vue packages in an application should use the same release version. New prereleases use `alpha`, `beta` or `rc` tags; stable releases use `latest`. On 2026-10-04 the registry still has `latest` pointing to the initial `0.0.1-alpha.0`, while `alpha` points to `0.0.1-alpha.5`. Use `alpha` during this prerelease stage.

```bash
npm view @lsw-abpvue/cli dist-tags
npm list @lsw-abpvue/core @lsw-abpvue/cli
```

Registry tags can move. The first command checks the available tags; the second checks your installed versions.

## Compatibility scope

The CLI checks ABP 10.5 and 10.6 as tested minor versions. A different ABP version produces a diagnostic warning and needs verification against that backend. Endpoint availability also depends on the installed ABP modules and edition.

The CLI requires Node 20 or newer. The application uses Vue 3 and Vue Router 4. The backend's .NET SDK and ABP CLI versions should match the target ABP solution.

## Source changes awaiting release

The current source includes normalized Windows preview paths and list preference keys based on built-in component identifiers. These changes were made after alpha.5. They will reach npm in a subsequent release.

Reka-based typeahead migration, additional motion behavior and other backlog items are not described as available features. [Release notes](./releases) link the actual published history.
