import { PermissionService, type Injector } from '@lsw-abpvue/core';
import { LinkedList } from '@lsw-abpvue/utils';
import type { GetInjected } from '../models/prop-data.js';
import { ExtensionsService } from '../services/extensions.service.js';
import { readLog, type ContributionOrigin } from './contributor-log.js';

/** The five extension points, under the names `ExtensionsService` gives them. */
const EXTENSION_POINTS = [
  'entityProps',
  'createFormProps',
  'editFormProps',
  'entityActions',
  'toolbarActions',
] as const;

export type ExtensionPointName = (typeof EXTENSION_POINTS)[number];

export interface InspectedItem {
  /** The prop's name, or the action's text. */
  name: string;
  origin: ContributionOrigin;
  /** The name of the function that contributed it. */
  contributor: string;
  /** Set when something later carries the same name, which is nearly always a mistake. */
  overriddenBy?: string;
  /** Why it will not be rendered: a policy, or a predicate that said no. */
  filteredBy?: string;
}

export interface InspectedPoint {
  extensionPoint: ExtensionPointName;
  items: InspectedItem[];
}

export interface OrphanContributor {
  extensionPoint: ExtensionPointName;
  /** The key the contributor was registered under; no module declared it. */
  componentKey: string;
  count: number;
}

export interface InspectionReport {
  identifier: string;
  points: InspectedPoint[];
  orphans: OrphanContributor[];
}

declare global {
  /**
   * The extension point inspector, on `globalThis` while an application built for
   * development is running. Read-only: it says what the extension points hold and why,
   * and changes nothing.
   */
  var __abpvue:
    | {
        /** Prints a table per extension point; every assembled component when none is named. */
        inspect(identifier?: string): void;
        /** The same as structured data, for a test to assert on. */
        dump(identifier?: string): InspectionReport[];
      }
    | undefined;
}

/** What a prop and an action have in common, as far as a report is concerned. */
interface Inspectable {
  name?: string;
  text?: string;
  permission?: string;
  visible?: (data?: unknown) => boolean;
  columnVisible?: (getInjected: GetInjected) => boolean;
}

function nameOf(item: Inspectable): string {
  return item.name ?? item.text ?? '(unnamed)';
}

function filterReasonOf(item: Inspectable, injector: Injector): string | undefined {
  if (item.permission && !injector.get(PermissionService).isGranted(item.permission)) {
    return `policy: ${item.permission}`;
  }

  const getInjected = injector.get.bind(injector) as GetInjected;
  if (item.columnVisible && !item.columnVisible(getInjected)) return 'columnVisible predicate';

  try {
    if (item.visible && item.visible() === false) return 'visible predicate';
  } catch {
    // A predicate that reads the record cannot be answered without one; it is decided
    // per row, and a report about no row in particular has nothing to say about it.
  }

  return undefined;
}

/**
 * Replays the contributors one at a time, so every entry can be attributed to the one
 * that added it. The list is the base class rather than the typed one: contributors only
 * ever use what a list can do, and nothing here looks at what the entries are.
 */
function inspectPoint(
  factory: object,
  identifier: string,
  injector: Injector,
): InspectedItem[] | undefined {
  const contributions = readLog(factory)?.byKey.get(identifier);
  if (!contributions) return undefined;

  const list = new LinkedList<Inspectable>();
  const sources = new Map<Inspectable, { origin: ContributionOrigin; contributor: string }>();

  for (const contribution of contributions) {
    const before = new Set(list.toArray());
    (contribution.callback as (list: LinkedList<Inspectable>) => void)(list);

    for (const item of list.toArray()) {
      if (!before.has(item)) {
        sources.set(item, { origin: contribution.origin, contributor: contribution.name });
      }
    }
  }

  const items = list.toArray();

  return items.map((item, index) => {
    const source = sources.get(item);
    const later = items.slice(index + 1).find(other => nameOf(other) === nameOf(item));
    const filteredBy = filterReasonOf(item, injector);

    return {
      name: nameOf(item),
      origin: source?.origin ?? 'contributor',
      contributor: source?.contributor ?? '(unknown)',
      ...(later ? { overriddenBy: sources.get(later)?.contributor ?? '(unknown)' } : {}),
      ...(filteredBy ? { filteredBy } : {}),
    };
  });
}

/** Every component key any extension point has been assembled for. */
function knownIdentifiers(extensions: ReturnType<typeof extensionsOf>): string[] {
  const identifiers = new Set<string>();

  for (const point of EXTENSION_POINTS) {
    for (const key of readLog(extensions[point])?.byKey.keys() ?? []) identifiers.add(key);
  }

  return [...identifiers];
}

function extensionsOf(injector: Injector) {
  return injector.get(ExtensionsService);
}

/**
 * What the extension points of one component ended up holding, and why.
 * @param injector Resolves the extension registries and the permissions
 * @param identifier The component key; every assembled one when it is left out
 */
export function dumpExtensions(injector: Injector, identifier?: string): InspectionReport[] {
  const extensions = extensionsOf(injector);
  const identifiers = identifier ? [identifier] : knownIdentifiers(extensions);

  return identifiers.map(key => {
    const points: InspectedPoint[] = [];
    const orphans: OrphanContributor[] = [];

    for (const point of EXTENSION_POINTS) {
      const items = inspectPoint(extensions[point], key, injector);
      if (items) points.push({ extensionPoint: point, items });

      for (const [componentKey, count] of readLog(extensions[point])?.orphans ?? []) {
        orphans.push({ extensionPoint: point, componentKey, count });
      }
    }

    return { identifier: key, points, orphans };
  });
}

function printReport(report: InspectionReport): void {
  for (const point of report.points) {
    if (point.items.length === 0) continue;

    console.group(`${report.identifier} · ${point.extensionPoint}`);
    console.table(point.items);
    console.groupEnd();
  }

  for (const orphan of report.orphans) {
    console.warn(
      `[abp] ${orphan.count} contributor(s) are registered for "${orphan.componentKey}" on ${orphan.extensionPoint}, which no module declares. Check the spelling of the component key.`,
    );
  }
}

/**
 * Puts the read-only inspector on `globalThis` as `__abpvue`. Called by the extensible
 * components in development only, so a production build never reaches it and the whole
 * module goes with the branch.
 *
 * It holds the root injector rather than the page's: a page is destroyed when the user
 * navigates away, and an inspector that stopped answering after that would be useless
 * exactly when somebody goes looking for it.
 *
 * @param injector Any injector; the root above it is what is kept
 */
export function installInspector(injector: Injector): void {
  let root = injector;
  while (root.parent) root = root.parent;

  globalThis.__abpvue = {
    inspect: identifier => {
      const reports = dumpExtensions(root, identifier);
      if (reports.length === 0) {
        console.info('[abp] No extension point has been assembled yet.');
        return;
      }

      for (const report of reports) printReport(report);
    },

    dump: identifier => dumpExtensions(root, identifier),
  };
}
