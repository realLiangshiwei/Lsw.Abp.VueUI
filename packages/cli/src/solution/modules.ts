import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Solution } from './locate.js';

/**
 * Reads module package names from the standard backend projects without building them.
 * @param solution The generated or existing backend solution
 */
export async function readModulePackages(solution: Solution): Promise<Set<string>> {
  const packages = new Set<string>();
  for (const project of Object.values(solution.projects)) {
    const files = await readdir(project, { withFileTypes: true }).catch((error: unknown) => {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOTDIR')
        return [];
      throw error;
    });
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.csproj')) continue;
      const xml = (await readFile(join(project, file.name), 'utf8')).replace(
        /<!--[\s\S]*?-->/g,
        '',
      );
      const references =
        /<(PackageReference|ProjectReference)\b[^>]*\bInclude\s*=\s*(["'])(.*?)\2/g;
      for (const match of xml.matchAll(references)) {
        const reference = match[3] ?? '';
        packages.add(
          match[1] === 'ProjectReference'
            ? (reference.split(/[\\/]/).at(-1) ?? '').replace(/\.csproj$/, '')
            : reference,
        );
      }
    }
  }
  return packages;
}
