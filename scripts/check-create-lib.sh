#!/usr/bin/env bash
# What `abpv create-lib` writes has to build outside this repository: a third-party
# module's UI package is a repository of its own, with the ABP Vue packages installed
# from npm rather than linked from a workspace. The template compiles here because it is
# a workspace member; this is the check that it also compiles when it is not one.
set -euo pipefail
cd "$(dirname "$0")/.."

root="$(pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

for package in components core theme-shared utils cli; do
  [ -d "packages/$package/dist" ] || { echo "No dist in packages/$package. Run 'pnpm build' first." >&2; exit 1; }
done

echo "Packing"
for package in components core theme-shared utils; do
  (cd "packages/$package" && pnpm pack --pack-destination "$work" >/dev/null)
done
ls "$work" | sed 's/^/  /'

cd "$work"
node "$root/packages/cli/dist/bin.js" create-lib Blogging --package @acme/blogging-vue

cd blogging
printf 'allowBuilds:\n  esbuild: true\n' > pnpm-workspace.yaml

# The ABP Vue packages are not on npm before 0.1, so the versions the renderer wrote
# resolve to nothing. Point the development dependencies at the tarballs instead, which
# satisfies the peer ranges as a consumer's own install would.
python3 "$root/scripts/local-tarball-deps.py" "$work"

echo "Installing"
pnpm install --ignore-workspace

echo "Type checking"
pnpm exec vue-tsc -p tsconfig.json

echo "Building"
pnpm build

for file in dist/index.js dist/index.d.ts dist/config/index.js dist/config/index.d.ts; do
  [ -f "$file" ] || { echo "The build produced no $file." >&2; exit 1; }
done

# `vue-tsc` names a component's declaration after the file it came from; a `.vue`
# specifier left in a published declaration only resolves under `moduleResolution:
# bundler`, which is the consumer's setting to make.
if grep -rn "\.vue'" dist --include='*.d.ts'; then
  echo "A published declaration still points at a .vue file." >&2
  exit 1
fi

echo "OK: what create-lib writes installs, type checks and builds outside the workspace."
