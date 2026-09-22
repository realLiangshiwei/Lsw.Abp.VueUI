// The application template is a workspace member -- that is what keeps it compiling and
// linting with everything else -- but it also has to travel inside the published CLI,
// which is what `abpv new` renders. This copies it into the CLI's build output.
//
// Dotfiles are stored with a leading underscore, because npm takes `.gitignore` out of
// every package it publishes. The renderer puts the dot back.
import { cpSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repoRoot, 'templates/app');
const target = join(repoRoot, 'packages/cli/dist/template/app');

const SKIPPED = new Set(['node_modules', 'dist', '.turbo']);

rmSync(target, { recursive: true, force: true });
mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, {
  recursive: true,
  filter: path => !SKIPPED.has(path.slice(source.length + 1).split(/[\\/]/)[0]),
});

/** Every dotfile, at any depth, under the name npm will carry. */
function hideDotfiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      hideDotfiles(join(dir, entry.name));
    } else if (entry.name.startsWith('.')) {
      renameSync(join(dir, entry.name), join(dir, `_${entry.name.slice(1)}`));
    }
  }
}

hideDotfiles(target);

console.log(`  template: ${readdirSync(target).length} entries in dist/template/app`);
