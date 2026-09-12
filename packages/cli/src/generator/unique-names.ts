import { pascalCase } from './names.js';
import type { GenerationReport } from './report.js';

export interface NameCandidate {
  /** What is being named, and what makes the order deterministic. */
  key: string;
  /** The CLR namespace, whose segments are what a collision falls back on. */
  namespace: string;
  preferred: string;
  /** Tried before the namespace: ABP's controller group name says what a page is. */
  alternate?: string | undefined;
}

/**
 * One TypeScript name per candidate. Two things wanting the same name is normal in a
 * backend -- two modules each with a `BookDto`, two controllers both called `Account` --
 * and the first by key keeps the plain name while the rest take something longer.
 *
 * @param candidates Everything being named, in any order
 * @param report Where the renames are recorded, because a renamed export is the one
 * thing about generated code a person has to be told
 */
export function resolveUniqueNames(
  candidates: NameCandidate[],
  report: GenerationReport,
): Map<string, string> {
  const byPreferred = new Map<string, NameCandidate[]>();
  for (const candidate of [...candidates].sort((left, right) => (left.key < right.key ? -1 : 1))) {
    const group = byPreferred.get(candidate.preferred) ?? [];
    byPreferred.set(candidate.preferred, [...group, candidate]);
  }

  const names = new Map<string, string>();
  const taken = new Set<string>();

  for (const [preferred, group] of byPreferred) {
    if (group.length === 1 && group[0]) {
      names.set(group[0].key, preferred);
      taken.add(preferred);
      continue;
    }

    for (const candidate of group) {
      const segments = candidate.namespace.split('.').filter(Boolean);
      let name = preferred;

      if (taken.has(name) && candidate.alternate) name = candidate.alternate;

      for (let extra = 1; taken.has(name) && extra <= segments.length; extra += 1) {
        name = pascalCase([...segments.slice(-extra), preferred].join('.'));
      }

      while (taken.has(name)) name = `${name}_`;

      names.set(candidate.key, name);
      taken.add(name);

      if (name !== preferred) {
        report.add(
          'renamed',
          `${candidate.key} is generated as ${name}, because ${preferred} is taken.`,
        );
      }
    }
  }

  return names;
}
