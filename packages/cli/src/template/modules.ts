import { CliError } from '../errors.js';
import { moduleBlocks, type TemplateManifest } from './manifest.js';

/**
 * Selects module UIs from backend references, or the template defaults without a backend.
 * @param manifest The template's module mappings and alternatives
 * @param packages Package and project names referenced by the backend
 * @param requested An explicit module list that overrides automatic selection
 */
export function selectModules(
  manifest: TemplateManifest,
  packages?: ReadonlySet<string>,
  requested?: readonly string[],
): string[] {
  const available = moduleBlocks(manifest);
  const selected = new Set(
    requested ??
      available.filter(name => {
        const block = manifest.blocks[name];
        if (packages && block?.backendPackages) {
          return block.backendPackages.some(reference => packages.has(reference));
        }
        return block?.default !== false;
      }),
  );

  for (const name of selected) {
    if (!available.includes(name)) {
      throw new CliError(`--modules has no "${name}". The template has: ${available.join(', ')}.`);
    }
    const alternative = manifest.blocks[name]?.replaces;
    if (alternative && selected.has(alternative)) {
      if (requested) {
        throw new CliError(`${alternative} and ${name} cannot be registered together. Choose one.`);
      }
      selected.delete(alternative);
    }
  }

  for (const name of selected) {
    for (const required of manifest.blocks[name]?.requires ?? []) {
      if (!selected.has(required)) {
        throw new CliError(`${name} requires ${required}. Include both in --modules.`);
      }
    }
  }
  return [...selected];
}
