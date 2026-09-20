import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const SOURCE_CODE_FILE = '.abpvue/source-code.json';

/** One package whose source now lives in the project. */
export interface ReleasedPackage {
  name: string;
  /** What it was when it was released, so an upgrade can say what has happened since. */
  version: string;
  /** Where its source went, relative to the project. */
  path: string;
  releasedAt: string;
}

export interface SourceCodeRecord {
  packages: Record<string, ReleasedPackage>;
}

/**
 * What a project has already taken into its own hands. `abpv update` leaves these alone
 * and `abpv doctor` says they no longer follow releases (design 08 §5).
 *
 * @param project The application root
 */
export async function readSourceCodeRecord(project: string): Promise<SourceCodeRecord> {
  try {
    const text = await readFile(join(project, SOURCE_CODE_FILE), 'utf8');
    const parsed = JSON.parse(text) as Partial<SourceCodeRecord>;

    return { packages: parsed.packages ?? {} };
  } catch {
    return { packages: {} };
  }
}

export async function writeSourceCodeRecord(
  project: string,
  record: SourceCodeRecord,
): Promise<void> {
  const path = join(project, SOURCE_CODE_FILE);
  await mkdir(dirname(path), { recursive: true });

  const packages = Object.fromEntries(
    Object.entries(record.packages).sort(([left], [right]) => (left < right ? -1 : 1)),
  );

  await writeFile(path, `${JSON.stringify({ packages }, null, 2)}\n`, 'utf8');
}
