import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Stamps every publishable package with 0.0.0-dev.{sha}, the version every merge to main
// goes out under (design 03 §4). Run right before `pnpm publish --tag dev`.
const sha = process.argv[2] ?? process.env.GITHUB_SHA;

if (!sha) {
  console.error('Usage: node scripts/set-dev-version.mjs <commit-sha>');
  process.exit(1);
}

const packagesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
const version = `0.0.0-dev.${sha.slice(0, 7)}`;

for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const manifestPath = join(packagesRoot, entry.name, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.private) continue;

  manifest.version = version;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${manifest.name}@${version}`);
}
