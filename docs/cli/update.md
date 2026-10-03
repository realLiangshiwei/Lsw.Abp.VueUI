# abpv update

```bash
abpv update                 # to whatever the registry publishes as latest
abpv update --to 0.2.0
abpv update --tag next
abpv update --dry-run
```

Every `@lsw-abpvue/*` range in `package.json` moves to one version, keeping the modifier
the project chose: `^0.1.0` becomes `^0.2.0`, `0.1.0` becomes `0.2.0`.

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
runs three migrations. There have been none so far, which is what an empty list means.

## Afterwards

It edits the manifest and nothing else. Install again.
