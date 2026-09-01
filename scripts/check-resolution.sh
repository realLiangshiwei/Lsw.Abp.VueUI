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

# `core` and `oauth` are resolvable through a bundler, which is how a Vue UI is consumed.
# They cannot be node16-clean: `core` exports `.vue` components, and a `.vue` specifier in
# a declaration needs `allowArbitraryExtensions` on the consumer's side. `oauth` inherits
# that through core's types, so holding it to a stricter line would only be theatre.
# `utils` has no Vue in it and is held to node16 — it is the one a plain Node script may
# reasonably import. What this rule would otherwise catch for us, a declaration naming a
# file we forgot to ship, `check-published-types.sh` catches under the profile we support.
BUNDLER_ONLY="core oauth"

status=0

for manifest in packages/*/package.json; do
  package="$(dirname "$manifest")"
  name="$(basename "$package")"
  [ -d "$package/dist" ] || { echo "No dist in $package. Run 'pnpm build' first." >&2; exit 1; }

  ignore=()
  case " $BUNDLER_ONLY " in
    *" $name "*) ignore=(--ignore-rules internal-resolution-error) ;;
  esac

  echo "── $name"
  (cd "$package" && "../../node_modules/.bin/publint") || status=1
  (cd "$package" && "../../node_modules/.bin/attw" --pack . --profile "$PROFILE" "${ignore[@]+"${ignore[@]}"}") || status=1
done

exit $status
