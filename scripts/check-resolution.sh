#!/usr/bin/env bash
# What a consumer's toolchain makes of what we publish (DoD 2.2).
#
#   publint  — the manifest itself: `exports` shapes, `types` before `import`, files that
#              are referenced but not shipped, fields that contradict `"type": "module"`.
#   attw     — whether each entry point resolves to declarations under the resolution
#              modes we claim to support.
#
# Both read the packed tarball, not the working tree, so they see exactly what npm would.
set -euo pipefail
cd "$(dirname "$0")/.."

# We publish ESM only (M0), so node10 -- which cannot read `exports` at all -- and the
# CJS half of node16 are not failures but the decision. `--profile esm-only` says so.
PROFILE=esm-only

status=0

for manifest in packages/*/package.json; do
  package="$(dirname "$manifest")"
  name="$(basename "$package")"
  [ -d "$package/dist" ] || { echo "No dist in $package. Run 'pnpm build' first." >&2; exit 1; }

  echo "── $name"
  (cd "$package" && "../../node_modules/.bin/publint") || status=1
  (cd "$package" && "../../node_modules/.bin/attw" --pack . --profile "$PROFILE") || status=1
done

exit $status
