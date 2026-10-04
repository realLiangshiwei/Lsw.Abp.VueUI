# abpv doctor

```bash
abpv doctor
abpv doctor --token "$ACCESS_TOKEN"
abpv doctor --offline
```

| | |
| --- | --- |
| `--token <token>` | Also compares the permission names |
| `--offline` | Only what can be told without the backend |
| `--solution <dir>` | Where to look |

Ten checks; each failure prints the command that fixes it. The list and what each one
means: [When it does not work](../guide/troubleshooting).

## Two of them are worth knowing about

**Proxy freshness** does not use a hash. The generation is run again in memory with the
options `generate-proxy.json` recorded, and compared to the disk file by file — so a
project that predates the check can still be checked, and nothing had to be recorded for
it.

**Object extension coverage** puts two numbers next to each other: how many extension
properties the backend declares, and how many the mapping rules recognise. A missing rule
looks exactly like a mistake in your own configuration, so the difference is named
property by property. If it names one, it is our bug.

Without a token the permission names are skipped, and it says so — anonymous
`grantedPolicies` is empty, and comparing against nothing would look like agreement.

The tested ABP minor versions are 10.5 and 10.6. A different version produces a warning;
it does not prevent the application from starting.

Solution metadata accepts comments and trailing commas, including those left by ABP's
template. Malformed metadata or a missing version produces a warning so the remaining
diagnostics can still run.
