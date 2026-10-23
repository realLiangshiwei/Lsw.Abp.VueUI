import { defineToken } from '@lsw-abpvue/core';

export { SHOW_ENTITY_DETAILS } from '@lsw-abpvue/audit-logging/config';
export type { ShowEntityDetails } from '@lsw-abpvue/audit-logging/config';

/** Operations available to audit log extension contributors. */
export interface AuditLogsPageCommands {
  openModal(id: string): void;
  exportToExcel(): Promise<void>;
}
export const AUDIT_LOGS_PAGE = defineToken<AuditLogsPageCommands>('AUDIT_LOGS_PAGE');
