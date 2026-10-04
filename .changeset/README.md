# Release maintenance

Public packages are versioned together. Changesets updates their manifests and changelogs; private workspace projects do not participate in versioning or tagging. Template dependencies use workspace ranges, which the CLI resolves to its own release version when creating a project.

## Changes required for each release

- Add a changeset describing the package changes.
- Apply the release versions and generated package changelogs.
- Review dependency and lockfile changes when dependencies change.
- Publish through `pnpm release`, which verifies the release and selects its npm tag.

## Documentation maintenance

- README files, installation instructions and ordinary guides use the default stable channel. Explain prerelease channels in the compatibility and upgrade guides.
- Do not copy the current version, registry tag snapshots or release summaries into guides. Package changelogs and the release notes page provide the published history.
- Version numbers used to explain semver ranges are examples, not installation recommendations. They do not need to change with each release.
- Update usage guides and their Chinese translations when an API, command, behavior or configuration changes. Update compatibility guidance when supported runtimes or backend versions change.
- Document breaking changes and manual upgrade steps when applicable. Routine releases do not require README or guide edits.
