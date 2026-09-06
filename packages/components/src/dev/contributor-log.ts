import type { PropContributorCallback } from '../models/props.js';

/** Where one entry of an assembled list came from. */
export type ContributionOrigin = 'default' | 'object-extension' | 'contributor';

export interface LoggedContribution {
  origin: ContributionOrigin;
  /** The contributor's function name, or `(anonymous)`. */
  name: string;
  callback: PropContributorCallback<never>;
}

export interface FactoryLog {
  /** Contributors per component key, in the order they run. */
  readonly byKey: Map<string, LoggedContribution[]>;
  /** Keys a contributor was registered under that no module ever declared. */
  readonly orphans: Map<string, number>;
}

/**
 * What every assembly did, for the inspector to read back. Keyed by the factory, so it
 * lives exactly as long as the injector that built it and never becomes shared state.
 *
 * Written only under `isDevMode()`; the reader is the development-only inspector.
 */
const logs = new WeakMap<object, FactoryLog>();

function logOf(factory: object): FactoryLog {
  const existing = logs.get(factory);
  if (existing) return existing;

  const created: FactoryLog = { byKey: new Map(), orphans: new Map() };
  logs.set(factory, created);

  return created;
}

/**
 * @param factory The extension point being assembled
 * @param componentKey The page the contributors belong to
 * @param contributions Every contributor that was applied, in order
 */
export function recordContributions(
  factory: object,
  componentKey: string,
  contributions: readonly LoggedContribution[],
): void {
  logOf(factory).byKey.set(componentKey, [...contributions]);
}

/**
 * @param factory The extension point being assembled
 * @param componentKeys Keys the contributors named that the module does not have
 */
export function recordOrphans(factory: object, componentKeys: readonly string[]): void {
  const { orphans } = logOf(factory);
  for (const key of componentKeys) orphans.set(key, (orphans.get(key) ?? 0) + 1);
}

export function readLog(factory: object): FactoryLog | undefined {
  return logs.get(factory);
}
