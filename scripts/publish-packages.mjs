import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyRelease } from './verify-release.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function releaseTag(version) {
  const match =
    typeof version === 'string' &&
    version.match(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/,
    );
  if (!match) throw new Error(`Invalid release version: ${version}`);

  const prerelease = match[4]?.split('.') ?? [];
  const metadata = match[5]?.split('.') ?? [];
  if (
    [...prerelease, ...metadata].some(identifier => !identifier) ||
    prerelease.some(identifier => /^0\d+$/.test(identifier))
  ) {
    throw new Error(`Invalid release version: ${version}`);
  }

  if (!prerelease.length) return 'latest';

  const tag = prerelease[0];
  if (!/^[A-Za-z][0-9A-Za-z-]*$/.test(tag) || tag === 'latest') {
    throw new Error(
      `Invalid prerelease channel in ${version}. Use a tag such as alpha, beta or rc.`,
    );
  }
  return tag;
}

function main() {
  const options = process.argv.slice(2);
  if (options.length === 1 && options[0] === '--help') {
    console.log('Usage: pnpm release [--dry-run]');
    console.log('Verifies the release, selects its npm tag, and skips published versions.');
    return;
  }
  if (options.some(option => option !== '--dry-run')) {
    throw new Error(
      'Unsupported release option. Use pnpm release [--dry-run]; tags are automatic.',
    );
  }

  const packages = readdirSync(join(repoRoot, 'packages'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry =>
      JSON.parse(readFileSync(join(repoRoot, 'packages', entry.name, 'package.json'), 'utf8')),
    )
    .filter(pkg => !pkg.private);
  if (!packages.length) throw new Error('No public packages found in packages/.');

  const version = packages[0].version;
  const tag = releaseTag(version);
  for (const pkg of packages) {
    if (typeof pkg.name !== 'string' || !pkg.name.startsWith('@lsw-abpvue/')) {
      throw new Error(`Unexpected public package: ${pkg.name}`);
    }
    if (pkg.version !== version) {
      throw new Error(
        `Release versions must match: ${pkg.name}@${pkg.version} differs from ${version}.`,
      );
    }
    if (pkg.publishConfig?.tag && pkg.publishConfig.tag !== tag) {
      throw new Error(`${pkg.name} publishConfig.tag conflicts with the automatic tag ${tag}.`);
    }
  }

  verifyRelease(repoRoot);
  console.log(`Release ${version}: ${packages.length} public packages, npm tag ${tag}.`);
  const result = spawnSync(
    'pnpm',
    [
      '--recursive',
      ...packages.flatMap(pkg => ['--filter', pkg.name]),
      'publish',
      '--access',
      'public',
      '--tag',
      tag,
      // Release tags are detached in CI; this preserves Changesets' publishing behavior.
      '--no-git-checks',
      ...options,
    ],
    { cwd: repoRoot, stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
