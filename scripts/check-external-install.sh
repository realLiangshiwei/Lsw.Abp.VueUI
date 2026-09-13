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

# `vue-demi` arrives under reka-ui, through @floating-ui/vue, and writes its Vue 2 / Vue 3
# shim in a postinstall. A consumer has to allow that build, so the check installs the way
# one that read the README would.
cd "$work"
cat > package.json <<'JSON'
{
  "name": "external-consumer",
  "private": true,
  "type": "module",
  "dependencies": {
    "vue": "^3.5.41",
    "vue-router": "^4.5.1",
    "bootstrap": "^5.3.8",
    "bootstrap-icons": "^1.13.1"
  }
}
JSON

cat > pnpm-workspace.yaml <<'YAML'
allowBuilds:
  vue-demi: true
YAML

cat > app.ts <<'TS'
import { AbpPermission, createInjector, defineService, inject, InternalStore, MemoryTokenStorage, PermissionService } from '@lsw-abpvue/core';
import { AbpDynamicLayout, lazyRoutes, provideAbpRouter } from '@lsw-abpvue/core/router';
import { provideAbpOAuth, withTokenStorage } from '@lsw-abpvue/oauth';
import { provideAbpThemeBasic } from '@lsw-abpvue/theme-basic';
import { AbpModal, provideThemeComponents, useAbpForm, Validators } from '@lsw-abpvue/theme-shared';
import { EntityProp, ExtensionsService, PropType } from '@lsw-abpvue/components';
import { EntityProp as EntityPropFromSubpath } from '@lsw-abpvue/components/extensible';
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

// The secondary entry point resolves, and the main one it imports is the same instance.
export const routing = provideAbpRouter([
  lazyRoutes('/identity', () => import('@lsw-abpvue/core').then(() => [])),
]);
export const layoutIsTyped: IsAny<typeof AbpDynamicLayout> extends false ? true : never = true;

// The authentication package resolves the same `core` as the app does, which is what
// makes `withTokenStorage` accept a token defined over there.
export const authentication = provideAbpOAuth(withTokenStorage(MemoryTokenStorage));

// The contract layer arrives as contracts: the stand-in components are real types, and a
// theme registers against the same tokens the contracts were resolved from.
export const modalIsTyped: IsAny<typeof AbpModal> extends false ? true : never = true;
export const theme = provideAbpThemeBasic();
export const override = provideThemeComponents({ AbpSpinner: AbpModal });

// The extension system: the subpath an Angular application knows the package by is the
// same module, so a contributor registered through either one lands in the same list.
export const column = EntityProp.create({ type: PropType.String, name: 'userName' });
export const oneExtensionSystem: true = (EntityProp === EntityPropFromSubpath) as true;
export const extensions = createInjector([]).get(ExtensionsService).entityProps.get('X').props;

const form = useAbpForm({ userName: { value: '', validators: [Validators.required()] } });
export const userName: string = form.controls.userName.value;
export const wasRejected: boolean = form.invalid;

// What a generated `policy-names.ts` asks an application to do, and what it buys: with
// the union merged in, a permission name the backend never declared stops compiling.
declare module '@lsw-abpvue/core' {
  interface AbpKnownPolicyName {
    'AbpIdentity.Users': true;
  }
}

const permission = createInjector([]).get(PermissionService);
export const declaredNameCompiles: boolean = permission.isGranted('AbpIdentity.Users');
export const expressionCompiles: boolean = permission.isGranted('AbpIdentity.Users || Whatever');
export const runtimeStringCompiles: boolean = permission.isGranted(userName);
// @ts-expect-error -- no module declares this one, which is the whole point.
export const misspelledDoesNot: boolean = permission.isGranted('AbpIdentity.Userz');
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
