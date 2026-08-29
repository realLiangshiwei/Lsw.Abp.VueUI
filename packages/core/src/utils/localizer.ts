import { interpolate } from '@lsw-abpvue/utils';
import type { LocalizationParam } from '../models/localization';
import type {
  ApplicationLocalizationConfigurationDto,
  ApplicationLocalizationResourceDto,
} from '../proxy/models';

export type ResourceTexts = Record<string, Record<string, string>>;

/**
 * A resource inherits from the ones it names, with its own texts winning. ABP resolves
 * this server-side only when the texts come with the configuration, so the UI has to do
 * it for the ones fetched separately.
 */
function withBaseResources(
  name: string,
  resources: Record<string, ApplicationLocalizationResourceDto>,
  seen: Set<string> = new Set(),
): Record<string, string> {
  const resource = resources[name];
  if (!resource || seen.has(name)) return {};
  seen.add(name);

  const inherited = resource.baseResources.map(base => withBaseResources(base, resources, seen));
  return Object.assign({}, ...inherited, resource.texts) as Record<string, string>;
}

/**
 * Flattens what the backend sent into one table per resource. `values` is the older
 * shape and `resources` the newer one; both arrive and the newer one wins.
 */
export function flattenResources(
  localization: ApplicationLocalizationConfigurationDto,
): ResourceTexts {
  const flattened: ResourceTexts = { ...localization.values };

  for (const name of Object.keys(localization.resources)) {
    flattened[name] = { ...flattened[name], ...withBaseResources(name, localization.resources) };
  }

  return flattened;
}

/** Texts shipped with the application override what the backend sent, key by key. */
export function mergeTexts(remote: ResourceTexts, local: ResourceTexts): ResourceTexts {
  const merged: ResourceTexts = { ...remote };

  for (const [name, texts] of Object.entries(local)) {
    merged[name] = { ...merged[name], ...texts };
  }

  return merged;
}

export interface LocalizerOptions {
  texts: ResourceTexts;
  defaultResourceName?: string | undefined;
  onMissing?: ((message: string) => void) | undefined;
}

/**
 * Resolves `Resource::Key` the way ABP does, including the parts that look like
 * mistakes but are not: a key without `::` passes through unchanged, and the resource
 * name `_` means "the key is already the text".
 */
export function createLocalizer(options: LocalizerOptions) {
  const { texts, defaultResourceName, onMissing } = options;

  return (param: LocalizationParam, params: unknown[]): string => {
    if (!param) return '';

    const defaultValue = typeof param === 'string' ? '' : param.defaultValue;
    const key = typeof param === 'string' ? param : param.key;
    const separator = key.indexOf('::');

    // Text that was never a key -- a column header piped through the localizer, say.
    if (separator < 0) return defaultValue || key;

    const resourceName = key.slice(0, separator) || defaultResourceName;
    const textKey = key.slice(separator + 2);

    if (resourceName === '_') return defaultValue || textKey;
    if (!resourceName) {
      onMissing?.(`No resource name in "${key}" and no defaultResourceName is configured.`);
      return defaultValue || textKey;
    }

    const resource = texts[resourceName];
    if (!resource) {
      onMissing?.(`Unknown localization resource "${resourceName}" in "${key}".`);
      return defaultValue || textKey;
    }

    const text = resource[textKey];
    if (text === undefined) return defaultValue || textKey;

    // Angular filters null parameters out, which silently shifts every later index;
    // `interpolate` leaves the placeholder in place instead (api-parity-map §4).
    return interpolate(text, params) || defaultValue || key;
  };
}
