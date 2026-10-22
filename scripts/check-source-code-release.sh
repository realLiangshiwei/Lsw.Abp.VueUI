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

python3 - "$app" <<'PY'
import json
import pathlib
import sys

app = pathlib.Path(sys.argv[1])
manifest = app / 'package.json'
data = json.loads(manifest.read_text())
for package in ['identity-pro', 'account-pro', 'audit-logging']:
    data['dependencies'][f'@lsw-abpvue/{package}'] = 'workspace:*'
manifest.write_text(json.dumps(data, indent=2) + '\n')
for name in ['src/main.ts', 'src/routes.ts']:
    path = app / name
    source = path.read_text().replace('@lsw-abpvue/identity', '@lsw-abpvue/identity-pro')
    source = source.replace('provideIdentityConfig', 'provideIdentityProConfig')
    source = source.replace('createIdentityRoutes', 'createIdentityProRoutes')
    path.write_text(source)
PY

if [ -n "${ABPVUE_CONSUMER_FIXTURES:-}" ]; then
cp "${ABPVUE_CONSUMER_FIXTURES}/pro-consumer-contract.ts" "$app/src/pro-consumer-contract.ts"
cp "${ABPVUE_CONSUMER_FIXTURES}/ProConsumerTable.vue" "$app/src/ProConsumerTable.vue"
cp "$root/e2e/fixtures/application-configuration.json" "$app/src/pro-consumer-configuration.json"
cat > "$app/src/pro-consumer.ts" <<'TS'
import type { ApplicationConfigurationDto } from '@lsw-abpvue/core';
import configuration from './pro-consumer-configuration.json';
import { verifyCommercialConsumer } from './pro-consumer-contract.js';

verifyCommercialConsumer(configuration as unknown as ApplicationConfigurationDto);
TS
printf '\nimport "./pro-consumer.js";\n' >> "$app/src/main.ts"

fi

# Install the candidate tarballs; every other dependency comes from the registry.
(cd "$app" && python3 "$root/scripts/local-tarball-deps.py" "$work/tarballs")

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
             packages/identity-pro/src/index.ts packages/identity-pro/config/src/index.ts \
             packages/identity-pro/proxy/src/index.ts \
             packages/account-pro/src/index.ts packages/account-pro/config/src/index.ts \
             packages/account-pro/proxy/src/index.ts \
             packages/account-pro/admin/src/index.ts \
             packages/account-pro/admin/config/src/index.ts \
             packages/audit-logging/src/index.ts packages/audit-logging/config/src/index.ts \
             packages/audit-logging/proxy/src/index.ts \
             packages/tenant-management/proxy/src/index.ts \
             packages/theme-basic/src/styles/style.css .abpvue/source-code.json; do
  [ -f "$app/$entry" ] || { echo "Missing $entry" >&2; exit 1; }
done
echo "  every entry point and the record are there"

node --input-type=module - "$app" "$root" <<'JS'
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const root = process.argv[2];
const { readConfigFile, sys } = createRequire(`${process.argv[3]}/package.json`)('typescript');
const record = JSON.parse(readFileSync(`${root}/.abpvue/source-code.json`, 'utf8'));
const result = readConfigFile(`${root}/tsconfig.json`, sys.readFile);
if (result.error) throw new TypeError('The released TypeScript configuration cannot be read.');
const config = result.config;
for (const name of ['identity-pro', 'account-pro', 'audit-logging']) {
  if (!record.packages[`@lsw-abpvue/${name}`]) throw new TypeError(`Missing source record for ${name}.`);
  for (const entry of ['', '/config', '/proxy']) {
    if (!config.compilerOptions.paths[`@lsw-abpvue/${name}${entry}`]) {
      throw new TypeError(`Missing released source alias for ${name}${entry}.`);
    }
  }
}
JS

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

if [ -n "${ABPVUE_CONSUMER_FIXTURES:-}" ]; then
echo "Running commercial contributors against the released source"
(cd "$app" && ./node_modules/.bin/vite build --ssr src/pro-consumer.ts \
  --outDir .pro-consumer-runtime --logLevel error >/dev/null)
(cd "$app" && node .pro-consumer-runtime/pro-consumer.js)

fi

echo "OK"
