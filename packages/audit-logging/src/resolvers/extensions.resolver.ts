import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
} from '@lsw-abpvue/components';
import { getCurrentInjector, inject } from '@lsw-abpvue/core';
import type { AuditLogDto } from '@lsw-abpvue/audit-logging/proxy';
import {
  DEFAULT_AUDIT_LOGGING_ENTITY_ACTIONS,
  DEFAULT_AUDIT_LOGGING_ENTITY_PROPS,
  DEFAULT_AUDIT_LOGGING_TOOLBAR_ACTIONS,
  DEFAULT_ENTITY_CHANGES_ENTITY_PROPS,
} from '../defaults/extensions.js';
import { AuditLoggingComponents } from '../enums/components.js';
import {
  AUDIT_LOGGING_ENTITY_ACTION_CONTRIBUTORS,
  AUDIT_LOGGING_ENTITY_PROP_CONTRIBUTORS,
  AUDIT_LOGGING_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

/** Applies audit defaults before application contributors. */
export function auditLoggingExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;
  const extensions = inject(ExtensionsService);
  const actions = inject(AUDIT_LOGGING_ENTITY_ACTION_CONTRIBUTORS, { optional: true });
  const logs = AuditLoggingComponents.AuditLogs;
  const changes = AuditLoggingComponents.EntityChanges;
  const entities = getObjectExtensionEntities(injector, 'AuditLogging');
  const backend = mapEntitiesToContributors<AuditLogDto>(
    injector,
    { [logs]: entities.AuditLog },
    'AuditLogging',
  );
  mergeWithDefaultActions(
    extensions.entityActions,
    { [logs]: DEFAULT_AUDIT_LOGGING_ENTITY_ACTIONS[logs] },
    { [logs]: actions?.[logs] ?? [] },
  );
  mergeWithDefaultActions(
    extensions.entityActions,
    { [changes]: DEFAULT_AUDIT_LOGGING_ENTITY_ACTIONS[changes] },
    { [changes]: actions?.[changes] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.entityProps,
    DEFAULT_AUDIT_LOGGING_ENTITY_PROPS,
    backend.prop,
    inject(AUDIT_LOGGING_ENTITY_PROP_CONTRIBUTORS, { optional: true }) ?? {},
  );
  mergeWithDefaultProps(
    extensions.entityProps,
    { [AuditLoggingComponents.EntityChanges]: DEFAULT_ENTITY_CHANGES_ENTITY_PROPS },
    {},
    {},
  );
  mergeWithDefaultActions(
    extensions.toolbarActions,
    DEFAULT_AUDIT_LOGGING_TOOLBAR_ACTIONS,
    inject(AUDIT_LOGGING_TOOLBAR_ACTION_CONTRIBUTORS, { optional: true }) ?? {},
  );
}
