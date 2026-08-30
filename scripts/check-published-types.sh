#!/usr/bin/env bash
# Type-checks the .d.ts we publish with an older TypeScript than we build with. Without
# this we only find out a consumer on TS 5.9 cannot use us when they open an issue.
set -euo pipefail
cd "$(dirname "$0")/.."

# Every entry point, not just the main one: a secondary entry is built on its own and can
# be broken on its own.
declarations=()
while IFS= read -r line; do
  declarations+=("$line")
done < <(node -e '
  const { dirname, resolve } = require("node:path");

  for (const manifest of process.argv.slice(1)) {
    const { exports = {} } = require(resolve(manifest));
    for (const entry of Object.values(exports)) {
      if (entry && typeof entry === "object" && entry.types) {
        console.log(`${dirname(manifest)}/${entry.types.replace(/^\.\//, "")}`);
      }
    }
  }
' packages/*/package.json)

if [ ${#declarations[@]} -eq 0 ] || [ ! -e "${declarations[0]}" ]; then
  echo "No built declarations found. Run 'pnpm build' first." >&2
  exit 1
fi

tsc="node_modules/typescript-downstream/bin/tsc"
version="$(node -p "require('./node_modules/typescript-downstream/package.json').version")"
echo "Checking these with TypeScript $version:"
printf '  %s\n' "${declarations[@]}"

node "$tsc" \
  --noEmit \
  --strict \
  --target es2022 \
  --module esnext \
  --moduleResolution bundler \
  --skipLibCheck \
  "${declarations[@]}"

echo "OK"
