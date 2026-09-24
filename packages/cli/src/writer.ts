import { mkdir, readdir, rm, rmdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { format, resolveConfig } from 'prettier';
import type { EmittedFile } from './generator/emit-models.js';

/** A file whose path would leave the directory it is meant to be written into. */
export class OutsideTargetError extends Error {
  constructor(path: string, target: string) {
    super(`"${path}" is not inside ${target}, so nothing was written.`);
    this.name = 'OutsideTargetError';
  }
}

export interface WriteResult {
  written: string[];
  removed: string[];
}

export interface WriteOptions {
  /** The directory the proxy lives in. */
  target: string;
  files: EmittedFile[];
  /** What the last generation wrote, so what it no longer writes is taken away. */
  previous?: string[] | undefined;
  /** Reports what would happen without touching anything. */
  dryRun?: boolean | undefined;
}

/** What generated code looks like in a project that has no Prettier configuration. */
const DEFAULT_FORMAT = {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
} as const;

/**
 * Formats generated code with the project's own Prettier configuration, so it does not
 * show up as a diff the first time anyone runs the formatter.
 *
 * @param path Where the file will be written, which is what picks the parser
 * @param content The generated source
 */
export async function formatSource(path: string, content: string): Promise<string> {
  try {
    const options = await resolveConfig(path);
    return await format(content, { ...(options ?? DEFAULT_FORMAT), filepath: path });
  } catch {
    // A file the formatter refuses is still a file the compiler may accept, and the
    // generation is more useful written than lost.
    return content;
  }
}

const formatted = (target: string, file: EmittedFile): Promise<string> =>
  formatSource(join(target, file.path), file.content);

/**
 * Whether a recorded or generated path stays inside the directory it belongs to. The
 * paths are built from names the backend chose, so this side does not get to assume it.
 */
function isInside(target: string, path: string): boolean {
  const inside = relative(target, join(target, path));

  return inside !== '' && !inside.startsWith('..');
}

/** Takes away the directories a removed file leaves behind, but never the target itself. */
async function pruneEmptyDirectories(target: string, from: string): Promise<void> {
  let directory = from;

  while (directory.startsWith(target) && directory !== target) {
    const entries = await readdir(directory).catch(() => ['keep']);
    if (entries.length > 0) return;

    await rmdir(directory).catch(() => undefined);
    directory = dirname(directory);
  }
}

/**
 * Replaces what is in the target directory with what was generated. Files the previous
 * generation wrote and this one did not are deleted, which is what keeps a renamed
 * controller from leaving its old service behind.
 *
 * @param options What to write, where, and what was there before
 */
export async function writeProxy(options: WriteOptions): Promise<WriteResult> {
  const written = options.files.map(file => file.path).sort();
  const stale = (options.previous ?? []).filter(path => !written.includes(path)).sort();

  if (options.dryRun) return { written, removed: stale };

  for (const path of stale) {
    if (!isInside(options.target, path)) continue;

    const absolute = join(options.target, path);
    await rm(absolute, { force: true });
    await pruneEmptyDirectories(options.target, dirname(absolute));
  }

  for (const file of options.files) {
    if (!isInside(options.target, file.path)) {
      throw new OutsideTargetError(file.path, options.target);
    }

    const absolute = join(options.target, file.path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, await formatted(options.target, file), 'utf8');
  }

  return { written, removed: stale };
}
