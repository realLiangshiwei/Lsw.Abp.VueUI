import { mapExtensionProperty } from '@lsw-abpvue/core/object-extensions';
import type { ApplicationConfiguration } from '../api-definition/object-extensions.js';

export { OBJECT_EXTENSION_TYPES as RECOGNISED_TYPES } from '@lsw-abpvue/core/object-extensions';

export interface ExtensionPropertyReport {
  /** `Identity.User.HireDate`, as the report names it. */
  path: string;
  /** False when the mapping would not produce what the backend configured. */
  recognised: boolean;
  /** Why it would not, or why it shows nowhere. */
  reason?: string | undefined;
}

export interface ExtensionCoverage {
  declared: number;
  recognised: number;
  /** Only the ones with something to say; the rest are covered and unremarkable. */
  reported: ExtensionPropertyReport[];
}

/**
 * How much of what the backend declares the mapping rules actually turn into something.
 * Fifteen rules turn `objectExtensions` into columns and fields, and missing any one of
 * them looks exactly like a configuration mistake from the outside -- so both numbers are
 * put next to each other, with the difference spelled out (risk R-07).
 *
 * @param configuration What `/api/abp/application-configuration` answered
 */
export function extensionCoverage(configuration: ApplicationConfiguration): ExtensionCoverage {
  const extensions = configuration.objectExtensions;
  const enums = (extensions?.enums ?? {}) as Record<string, unknown>;

  let declared = 0;
  let recognised = 0;
  const reported: ExtensionPropertyReport[] = [];

  for (const [module, definition] of Object.entries(extensions?.modules ?? {})) {
    for (const [entity, properties] of Object.entries(definition.entities ?? {})) {
      for (const [name, property] of Object.entries(properties.properties ?? {})) {
        const mapped = mapExtensionProperty(name, property, enums);
        const report: ExtensionPropertyReport = {
          path: `${module}.${entity}.${name}`,
          recognised: mapped.recognised,
          ...(mapped.reason ? { reason: mapped.reason } : {}),
        };

        declared += 1;
        if (report.recognised) recognised += 1;
        if (report.reason) reported.push(report);
      }
    }
  }

  return { declared, recognised, reported };
}
