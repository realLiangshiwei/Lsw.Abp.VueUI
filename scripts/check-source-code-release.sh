#!/usr/bin/env bash
# Releases module and theme source into a project that installed them from tarballs,
# and checks the three things the milestone asks for (M8 V5):
#   - the project still compiles
#   - not one import in its own `src` had to change
#   - what was released is recorded
set -euo pipefail
cd "$(dirname "$0")/.."

root="$(pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

echo "Packing"
for manifest in packages/*/package.json; do
  package="$(dirname "$manifest")"
  [ -d "$package/dist" ] || { echo "No dist in $package. Run 'pnpm build' first." >&2; exit 1; }
  (cd "$package" && pnpm pack --pack-destination "$work/tarballs" >/dev/null)
done

echo "Creating a project"
mkdir -p "$work/project"
(cd "$work/project" && node "$root/packages/cli/dist/bin.js" new Acme.BookStore \
  --no-backend --backend https://localhost:44335 --skip-install --skip-proxy >/dev/null)

app="$work/project/Acme.BookStore"

# The packages are not on npm before 0.1, so the project installs the tarballs that were
# just built. Everything else it depends on comes from the registry, as a user's would.
python3 - "$app/package.json" "$work/tarballs" <<'PY'
import json, os, sys
manifest_path, tarballs = sys.argv[1], sys.argv[2]
with open(manifest_path) as file:
    manifest = json.load(file)

available = {}
for name in os.listdir(tarballs):
    available[name.rsplit('-', 1)[0].replace('lsw-abpvue-', '@lsw-abpvue/')] = os.path.join(tarballs, name)

for group in ('dependencies', 'devDependencies'):
    for name in list(manifest.get(group, {})):
        if name in available:
            manifest[group][name] = f"file:{available[name]}"

with open(manifest_path, 'w') as file:
    json.dump(manifest, file, indent=2)
PY

echo "Installing"
(cd "$app" && pnpm install)

before="$(cd "$app/src" && find . -type f | sort | xargs shasum | shasum)"

# `all` is the module UIs; the theme is named because a stylesheet entry point is the
# one shape nothing else covers.
echo "Releasing the source of every module, and the theme"
(cd "$app" && node "$root/packages/cli/dist/bin.js" add-package \
  all,@lsw-abpvue/theme-basic --with-source-code)

after="$(cd "$app/src" && find . -type f | sort | xargs shasum | shasum)"
if [ "$before" != "$after" ]; then
  echo "The application's own source changed; releasing a package must not touch it." >&2
  exit 1
fi
echo "  the application's own source is untouched"

for entry in packages/identity/src/index.ts packages/identity/config/src/index.ts \
             packages/identity/proxy/src/index.ts packages/account/config/src/index.ts \
             packages/tenant-management/proxy/src/index.ts \
             packages/theme-basic/src/styles/style.css .abpvue/source-code.json; do
  [ -f "$app/$entry" ] || { echo "Missing $entry" >&2; exit 1; }
done
echo "  every entry point and the record are there"

# What `all` leaves on npm: the layers a provider replaces, and nothing else.
remaining="$(node -e '
const released = Object.keys(require(process.argv[1]).packages);
const declared = Object.keys(require(process.argv[2]).dependencies).filter(n => n.startsWith("@lsw-abpvue/"));
console.log(declared.filter(n => !released.includes(n)).sort().join(" "));
' "$app/.abpvue/source-code.json" "$app/package.json")"
echo "  still on npm: $remaining"

# The released source imports what its package depended on, and the release added those
# to the project. A user does the same thing the note tells them to.
echo "Installing again, for what the release added"
# CI freezes existing lockfiles by default, but the release just changed the manifest.
(cd "$app" && pnpm install --no-frozen-lockfile)

echo "Type-checking the project"
(cd "$app" && ./node_modules/.bin/vue-tsc -p tsconfig.json)

echo "Building it"
(cd "$app" && ./node_modules/.bin/vite build --logLevel error >/dev/null)

echo "OK"
