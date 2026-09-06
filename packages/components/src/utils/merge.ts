import { isDevMode, type LinkedList } from '@lsw-abpvue/utils';
import {
  recordContributions,
  recordOrphans,
  type ContributionOrigin,
  type LoggedContribution,
} from '../dev/contributor-log.js';
import type { Actions } from '../models/actions.js';
import type { PropContributorCallback, Props } from '../models/props.js';
import { isObjectExtensionContributor } from './object-extension-marker.js';

/** Any of the three prop registries of `ExtensionsService`. */
export interface PropsFactoryOf<V> {
  get(componentKey: string): Props<LinkedList<V>>;
}

/** Either of the two action registries of `ExtensionsService`. */
export interface ActionsFactoryOf<V> {
  get(componentKey: string): Actions<LinkedList<V>>;
}

/** What both registries hand back: somewhere to put contributors. */
interface Contributions<L> {
  addContributor(callback: PropContributorCallback<L>): void;
  clearContributors(): void;
}

function originOf(callback: PropContributorCallback<never>): ContributionOrigin {
  return isObjectExtensionContributor(callback) ? 'object-extension' : 'contributor';
}

function merge<V>(
  factory: object,
  get: (componentKey: string) => Contributions<LinkedList<V>>,
  defaults: Record<string, readonly V[]>,
  contributorSets: readonly Record<string, readonly PropContributorCallback<LinkedList<V>>[]>[],
): void {
  for (const [componentKey, values] of Object.entries(defaults)) {
    const target = get(componentKey);
    const applied: LoggedContribution[] = [];

    // Clearing first is what makes assembly idempotent: a resolver that runs again --
    // a repeated navigation, a language change -- replaces the contributors rather than
    // stacking a second copy of every column on top of the first.
    target.clearContributors();

    const addDefaults = (propList: LinkedList<V>): void => void propList.addManyTail(values);
    target.addContributor(addDefaults);
    applied.push({
      origin: 'default',
      name: 'defaults',
      callback: addDefaults as PropContributorCallback<never>,
    });

    for (const set of contributorSets) {
      for (const callback of set[componentKey] ?? []) {
        target.addContributor(callback);
        applied.push({
          origin: originOf(callback as PropContributorCallback<never>),
          name: callback.name || '(anonymous)',
          callback: callback as PropContributorCallback<never>,
        });
      }
    }

    if (isDevMode()) recordContributions(factory, componentKey, applied);
  }

  if (isDevMode()) {
    const declared = new Set(Object.keys(defaults));
    recordOrphans(
      factory,
      contributorSets.flatMap(set => Object.keys(set)).filter(key => !declared.has(key)),
    );
  }
}

/**
 * Assembles one prop extension point: the module's defaults first, then the backend's
 * object extensions, then whatever the application contributed -- so the later ones can
 * change what the earlier ones did. Running it again replaces the result instead of
 * adding to it.
 *
 * A contributor registered under a component key the module never declared is ignored,
 * as it is in Angular; `__abpvue.dump()` reports it rather than leaving it silent.
 *
 * @param factory One of `entityProps`, `createFormProps`, `editFormProps`
 * @param defaults The module's own props, per component key
 * @param contributorSets Contributor callbacks per component key, in priority order
 */
export function mergeWithDefaultProps<V>(
  // The record type comes from the defaults: the registries are erased, so inferring it
  // from the factory as well would land on `unknown` and reject every typed default.
  factory: PropsFactoryOf<NoInfer<V>>,
  defaults: Record<string, readonly V[]>,
  ...contributorSets: Record<string, readonly PropContributorCallback<LinkedList<V>>[]>[]
): void {
  merge(factory, componentKey => factory.get(componentKey), defaults, contributorSets);
}

/**
 * The same for the two action extension points.
 * @param factory Either `entityActions` or `toolbarActions`
 * @param defaults The module's own actions, per component key
 * @param contributorSets Contributor callbacks per component key, in priority order
 */
export function mergeWithDefaultActions<V>(
  factory: ActionsFactoryOf<NoInfer<V>>,
  defaults: Record<string, readonly V[]>,
  ...contributorSets: Record<string, readonly PropContributorCallback<LinkedList<V>>[]>[]
): void {
  merge(factory, componentKey => factory.get(componentKey), defaults, contributorSets);
}
