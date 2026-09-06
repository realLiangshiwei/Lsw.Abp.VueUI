// `vue-tsc` names a component's declaration after the file it came from --
// `AbpPermission.vue.d.ts` -- and refers to it as `./AbpPermission.vue`. A `.vue`
// specifier in a published declaration only resolves with `allowArbitraryExtensions`,
// which is the consumer's setting to make, so the whole package would be readable only
// under `moduleResolution: bundler`.
//
// The declarations themselves have nothing Vue-specific about them: they are ordinary
// `.d.ts` files describing a `DefineComponent`. So they are renamed to what every other
// declaration is called and referred to the same way, and the packages resolve
// everywhere. Runtime output is untouched: the components are compiled into the bundle.
//
// The same pass drops the stylesheet import a theme's entry point carries. It is there
// so the bundler collects the CSS; in a declaration it resolves to nothing, because the
// stylesheet is emitted as `dist/style.css` rather than beside the source it came from.
import { readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');

/** Every file under `dir`, depth first. */
function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const files = [...walk(root)];
const renamed = [];

for (const path of files) {
  const match = /^(.*)\.vue(\.d\.ts(\.map)?)$/.exec(basename(path));
  if (!match) continue;

  const target = join(path, '..', `${match[1]}${match[2]}`);
  // A `Foo.ts` next to a `Foo.vue` would have us overwrite one with the other.
  if (files.includes(target)) {
    throw new Error(`Cannot rename ${path}: ${target} already exists. Rename one of the sources.`);
  }

  renameSync(path, target);
  renamed.push(basename(path));
}

for (const path of files.map(file => file.replace(/\.vue(\.d\.ts(\.map)?)$/, '$1'))) {
  if (!path.endsWith('.d.ts') && !path.endsWith('.d.ts.map')) continue;

  const before = readFileSync(path, 'utf8');
  // `from './x.vue'` becomes `from './x.js'`, the way every other sibling is named.
  const after = before
    .replace(/^import\s+["']\.{1,2}\/[^"']*\.css["'];?\r?\n/gm, '')
    .replace(/(from\s*["'])(\.{1,2}\/[^"']*)\.vue(["'])/g, '$1$2.js$3')
    .replace(/(sourceMappingURL=.*?)\.vue(\.d\.ts\.map)/g, '$1$2')
    .replace(/("file"\s*:\s*"[^"]*?)\.vue(\.d\.ts")/g, '$1$2');

  if (after !== before) writeFileSync(path, after);
}

if (renamed.length) console.log(`  vue declarations: ${renamed.join(', ')}`);
