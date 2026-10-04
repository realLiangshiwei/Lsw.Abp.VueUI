# abpv update

```bash
abpv update                # the latest stable release
abpv update --tag alpha     # opt into the alpha channel
abpv update --dry-run
```

Every `@lsw-abpvue/*` range in `package.json` moves to one version, keeping the modifier
the project chose. For example, when moving from `0.1.0` to `0.2.0`, `^0.1.0` becomes
`^0.2.0` and `0.1.0` becomes `0.2.0`.

## What it leaves alone

| | |
| --- | --- |
| A range that is not a plain version | `file:` paths, tags, git URLs. Somebody chose those on purpose |
| A package whose source was released | The local source copy belongs to the application; changing its package range would not update that copy |

Both are listed with the reason, rather than silently skipped.

## Released source summaries

For each released package, the result includes changelog sections newer than its recorded
release version and no newer than the target version. The CLI reads the installed
`CHANGELOG.md` first, then the exact target version's registry archive when necessary.
It reports missing notes or an unreachable registry without preventing other upgrades.

Use the summary to update local source manually. The CLI does not overwrite that source
or claim its release marker has moved to the target version.

## Migrations

A release with a breaking change carries a migration, and everything between the version
the project is on and the version it is going to runs in order — skipping three releases
runs the migrations registered for those versions. If none apply, the migration list is empty.

## Afterwards

It edits the manifest and nothing else. Install again.

`--to <version>` chooses an exact published version, `--tag` chooses a registry tag (default `latest`), and `--dry-run` previews changes. The default selects the stable release; select a prerelease channel explicitly when needed.
