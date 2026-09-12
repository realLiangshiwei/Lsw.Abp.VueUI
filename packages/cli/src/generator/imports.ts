import { relativeNamespacePath } from './names.js';

/**
 * The import specifier for a file in another namespace's directory.
 * @param from The namespace of the file being written
 * @param to The namespace of the file being imported
 * @param file The file's base name, without its extension
 */
export function moduleSpecifier(from: string, to: string, file: string): string {
  const path = relativeNamespacePath(from, to);

  return `${path === '.' ? '.' : path}/${file}.js`;
}

/**
 * Collects what a generated file imports. Everything a proxy needs from another file is
 * a type, except the enums and the handful of symbols a service is built from, so both
 * kinds are kept apart -- `verbatimModuleSyntax` makes the difference load-bearing.
 */
export class ImportCollector {
  private readonly types = new Map<string, Set<string>>();
  private readonly values = new Map<string, Set<string>>();

  addType(path: string, name: string): void {
    this.add(this.types, path, name);
  }

  addValue(path: string, name: string): void {
    this.add(this.values, path, name);
  }

  private add(target: Map<string, Set<string>>, path: string, name: string): void {
    const existing = target.get(path);
    if (existing) existing.add(name);
    else target.set(path, new Set([name]));
  }

  /** Packages first, then relative paths, each alphabetically. */
  private static comparePaths(left: string, right: string): number {
    const relative = (path: string) => (path.startsWith('.') ? 1 : 0);

    return relative(left) - relative(right) || (left < right ? -1 : 1);
  }

  /** Case-insensitive, so `defineService` and `RestService` read as one alphabet. */
  private static compareNames(left: string, right: string): number {
    return left.toLowerCase() < right.toLowerCase() ? -1 : 1;
  }

  render(): string {
    const paths = [...new Set([...this.values.keys(), ...this.types.keys()])].sort(
      ImportCollector.comparePaths,
    );

    return paths
      .flatMap(path => {
        const values = [...(this.values.get(path) ?? [])].sort(ImportCollector.compareNames);
        // A name imported as a value covers the places it is used as a type too.
        const types = [...(this.types.get(path) ?? [])]
          .filter(name => !values.includes(name))
          .sort();

        return [
          ...(values.length ? [`import { ${values.join(', ')} } from '${path}';`] : []),
          ...(types.length ? [`import type { ${types.join(', ')} } from '${path}';`] : []),
        ];
      })
      .join('\n');
  }

  get isEmpty(): boolean {
    return this.types.size === 0 && this.values.size === 0;
  }
}
