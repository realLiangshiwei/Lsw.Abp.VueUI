# Versions and compatibility

This site is built from `main`. It documents the source currently in that branch; it is not a frozen manual for every previously published version.

## Published packages

Stable releases use the `latest` dist-tag, which is selected when an installation command does not specify a version or tag. All public ABP Vue packages in an application should use the same release version. Prereleases use `alpha`, `beta` or `rc` tags and must be selected explicitly.

```bash
npm view @lsw-abpvue/cli dist-tags
npm list @lsw-abpvue/core @lsw-abpvue/cli
```

Registry tags can move. The first command checks the available tags; the second checks your installed versions.

Published versions and their changes are listed in [release notes](./releases).

## Compatibility scope

The CLI checks ABP 10.5 and 10.6 as tested minor versions. A different ABP version produces a diagnostic warning and needs verification against that backend. Endpoint availability also depends on the installed ABP modules and edition.

The CLI requires Node 20 or newer. The application uses Vue 3 and Vue Router 4. The backend's .NET SDK and ABP CLI versions should match the target ABP solution.

## Capability scope

| Capability | Current scope |
| --- | --- |
| Built-in open-source modules | Account, Identity, Permission, Tenant, Feature and Setting; backend modules/policies must exist |
| SSR | Platform abstractions support server-safe access; no complete generated SSR template |
| PWA | No preconfigured service-worker/offline template |
| Global modal confirmation switch / fullscreen | Not implemented; see [modal forms](/utilities/modals) |
| Motion | Further motion remains in Backlog; visibility events do not signify animation completion |
