import { isAuditLoggingEnabled } from '@lsw-abpvue/audit-logging/config';
import { ConfigStateService, inject } from '@lsw-abpvue/core';

export function auditLoggingGuard(): boolean {
  return isAuditLoggingEnabled(inject(ConfigStateService));
}
