import { CliError } from '../errors.js';

const BEGIN = /^[ \t]*\/\/ abpv:begin ([a-z0-9:-]+)[ \t]*$/;
const END = /^[ \t]*\/\/ abpv:end ([a-z0-9:-]+)[ \t]*$/;

/** The lines inside each `abpv:begin` block of a file, keyed by the block's name. */
export function readBlocks(source: string): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  const open: string[] = [];

  for (const line of source.split('\n')) {
    const begin = BEGIN.exec(line);

    if (begin) {
      open.push(begin[1] as string);
      blocks.set(begin[1] as string, []);
      continue;
    }

    const end = END.exec(line);

    if (end) {
      open.pop();
      continue;
    }

    for (const name of open) blocks.get(name)?.push(line);
  }

  return blocks;
}

export interface MergeResult {
  source: string;
  /** Blocks the generation has and the file on disk does not. */
  missing: string[];
  /** False when the merge changed nothing, which is the usual second run. */
  changed: boolean;
}

/**
 * Puts the generated blocks back into a file somebody has since edited: what is inside a
 * marker is the generator's, what is outside it is theirs. A block the file does not
 * have is reported rather than guessed at -- there is no way to know where in a file a
 * person would have wanted it.
 *
 * @param existing The file as it is on disk
 * @param generated The file as the generator would write it now
 */
export function mergeBlocks(existing: string, generated: string): MergeResult {
  const blocks = readBlocks(generated);
  const seen = new Set<string>();
  const lines: string[] = [];
  let skipping: string | undefined;

  for (const line of existing.split('\n')) {
    const begin = BEGIN.exec(line);

    if (begin && !skipping) {
      const name = begin[1] as string;
      const replacement = blocks.get(name);

      lines.push(line);

      if (replacement) {
        seen.add(name);
        skipping = name;
        lines.push(...replacement);
      }

      continue;
    }

    const end = END.exec(line);

    if (end && end[1] === skipping) skipping = undefined;
    if (!skipping) lines.push(line);
  }

  if (skipping) {
    // Everything after the marker that was never closed has been skipped looking for an
    // end that does not come. Writing that out would delete whatever the file had below
    // it, so nothing is written at all.
    throw new CliError(
      `The "${skipping}" block is opened but never closed: there is no "// abpv:end ` +
        `${skipping}" after it. Put the marker back, or delete the file and generate it again.`,
    );
  }

  const source = lines.join('\n');

  return {
    source,
    missing: [...blocks.keys()].filter(name => !seen.has(name)),
    changed: source !== existing,
  };
}
