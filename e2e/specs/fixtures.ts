import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { abpVersionIn } from '../../packages/cli/src/solution/abp-version.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', 'fixtures');

/** One backend's captured answers, and the ABP version they came from. */
export interface FixtureSet {
  /** `10.6.0`, or the directory name for a set captured into one. */
  version: string;
  apiDefinition: string;
  applicationConfiguration: string;
  localization: string;
}

/** The version the test backend in this repository is generated for. */
function defaultVersion(): string {
  const solution = resolve(here, '../backend/BookStore/BookStore.abpsln');

  try {
    return abpVersionIn(readFileSync(solution, 'utf8')) ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function setAt(directory: string, version: string): FixtureSet | undefined {
  const apiDefinition = join(directory, 'api-definition.json');
  if (!existsSync(apiDefinition)) return undefined;

  return {
    version,
    apiDefinition,
    applicationConfiguration: join(directory, 'application-configuration.json'),
    localization: join(directory, 'application-localization.en.json'),
  };
}

/**
 * Every captured backend the contract tests run against: the one in `e2e/fixtures`, plus
 * one per subdirectory. A second ABP version is added by capturing into a directory
 * named for it — `scripts/capture-fixtures.sh --into e2e/fixtures/10.7` — which is what
 * makes the matrix a matrix rather than a single row.
 */
export function fixtureSets(): FixtureSet[] {
  const sets = [setAt(root, defaultVersion())].filter(
    (set): set is FixtureSet => set !== undefined,
  );

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const set = setAt(join(root, entry.name), entry.name);
    if (set) sets.push(set);
  }

  return sets.sort((left, right) => (left.version < right.version ? -1 : 1));
}
