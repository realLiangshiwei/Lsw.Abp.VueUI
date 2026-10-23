import type { ProviderInput } from '@lsw-abpvue/core';
import {
  AUDIT_LOGGING_ENTITY_ACTION_CONTRIBUTORS,
  AUDIT_LOGGING_ENTITY_PROP_CONTRIBUTORS,
  AUDIT_LOGGING_TOOLBAR_ACTION_CONTRIBUTORS,
  type AuditLoggingConfigOptions,
} from '../tokens/extensions.token.js';

/** Registers typed audit contributors. */
export function provideAuditLogging(options: AuditLoggingConfigOptions = {}): ProviderInput[] {
  return [
    {
      provide: AUDIT_LOGGING_ENTITY_ACTION_CONTRIBUTORS,
      useValue: options.entityActionContributors ?? {},
    },
    {
      provide: AUDIT_LOGGING_ENTITY_PROP_CONTRIBUTORS,
      useValue: options.entityPropContributors ?? {},
    },
    {
      provide: AUDIT_LOGGING_TOOLBAR_ACTION_CONTRIBUTORS,
      useValue: options.toolbarActionContributors ?? {},
    },
  ];
}
