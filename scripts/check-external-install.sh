#!/usr/bin/env bash
# Installs the packed packages into a clean project outside the workspace and checks the
# two things a workspace can never prove on its own (M1 V7, DoD 2.2):
#   - a consumer gets exactly one physical copy of each package, so the DI tokens, which
#     are symbols, stay comparable
#   - the published declarations are usable from a project that only did `pnpm add`
set -euo pipefail
cd "$(dirname "$0")/.."

root="$(pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

echo "Packing"
for manifest in packages/*/package.json; do
  package="$(dirname "$manifest")"
  [ -d "$package/dist" ] || { echo "No dist in $package. Run 'pnpm build' first." >&2; exit 1; }
  # pnpm, not npm: only pnpm rewrites `workspace:^` into a real version range, and
  # shipping that protocol in peerDependencies breaks every consumer.
  (cd "$package" && pnpm pack --pack-destination "$work" >/dev/null)
done
ls "$work" | sed 's/^/  /'

for tarball in "$work"/*.tgz; do
  if tar -xzOf "$tarball" package/package.json |
    python3 -c 'import json,sys; m=json.load(sys.stdin); print("\n".join(f"{f}.{n}={v}" for f in ("dependencies","peerDependencies","optionalDependencies") for n,v in m.get(f,{}).items() if str(v).startswith("workspace:")))' |
    grep .; then
    echo "$(basename "$tarball") still carries the workspace protocol." >&2
    exit 1
  fi
done

cd "$work"
cat > package.json <<'JSON'
{
  "name": "external-consumer",
  "private": true,
  "type": "module",
  "dependencies": { "vue": "^3.5.41" }
}
JSON

cat > app.ts <<'TS'
import { AbpPermission, createInjector, defineService, inject, InternalStore } from '@lsw-abpvue/core';
import { interpolate } from '@lsw-abpvue/utils';

const Greeter = defineService('Greeter', () => {
  const store = new InternalStore<{ template: string }>({ template: 'Hei {0}.' });
  return { greet: (name: string) => interpolate(store.state.value.template, [name]) };
});

export const greeting: string = createInjector([]).get(Greeter).greet('ABP');
export const injected = () => inject(Greeter);

// A component compiled from an .vue file has to arrive as a real type, not `any`
// (milestone V6): `any` would make every misuse in a consumer's template compile.
type IsAny<T> = 0 extends 1 & T ? true : false;
export const componentIsTyped: IsAny<typeof AbpPermission> extends false ? true : never = true;
TS

cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "types": []
  },
  "include": ["app.ts"]
}
JSON

echo "Installing"
pnpm add --silent ./*.tgz >/dev/null

copies="$(find node_modules/.pnpm -maxdepth 4 -type d -path '*/node_modules/@lsw-abpvue/*' | sed 's#.*/@lsw-abpvue/##' | sort | uniq -c)"
echo "Physical copies under .pnpm:"
echo "$copies" | sed 's/^/  /'

if echo "$copies" | awk '{ if ($1 != 1) exit 1 }'; then
  echo "  one copy of each"
else
  echo "A package is installed more than once; DI tokens would stop matching." >&2
  exit 1
fi

echo "Type-checking the consumer with the workspace TypeScript"
"$root/node_modules/typescript/bin/tsc" -p tsconfig.json
echo "OK"
