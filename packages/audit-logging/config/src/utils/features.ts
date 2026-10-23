import type { ConfigStateService } from '@lsw-abpvue/core';

export function isAuditLoggingEnabled(config: ConfigStateService): boolean {
  return config.snapshot().features.values['AuditLogging.Enable']?.toLowerCase() !== 'false';
}
