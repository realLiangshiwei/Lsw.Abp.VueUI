import { mkdir, readdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Copies a directory tree. `fs.cp` would do it, but it is still experimental on the
 * oldest Node this CLI supports and prints a warning to say so.
 *
 * @param from The directory to copy
 * @param to Where it lands; created if it is not there
 */
export async function copyDirectory(from: string, to: string): Promise<string[]> {
  const copied: string[] = [];
  await mkdir(to, { recursive: true });

  for (const entry of await readdir(from, { withFileTypes: true })) {
    const source = join(from, entry.name);
    const target = join(to, entry.name);

    if (entry.isDirectory()) {
      copied.push(...(await copyDirectory(source, target)));
    } else {
      await copyFile(source, target);
      copied.push(target);
    }
  }

  return copied;
}
