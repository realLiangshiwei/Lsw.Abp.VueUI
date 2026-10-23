import { AuditLoggingPolicyNames } from '@lsw-abpvue/audit-logging/config';
import type { ExportAuditLogsOutput } from '@lsw-abpvue/audit-logging/proxy';
import { inject, WindowService } from '@lsw-abpvue/core';
import { useToaster } from '@lsw-abpvue/theme-shared';
import { useAuditLogging } from './use-audit-logging.js';
import { useAuditRequest } from './use-audit-request.js';

export class AuditLogExportError extends Error {
  constructor() {
    super('The audit export response has no valid file. Refresh the export to try again.');
    this.name = 'AuditLogExportError';
  }
}

export function auditExportFile(output: ExportAuditLogsOutput): Blob {
  const raw = output.fileData;
  if (!output.fileName || !raw?.length) throw new AuditLogExportError();
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes =
      typeof raw === 'string'
        ? Uint8Array.from(atob(raw), character => character.charCodeAt(0))
        : Uint8Array.from(raw);
  } catch {
    throw new AuditLogExportError();
  }
  if (
    !bytes.length ||
    (Array.isArray(raw) && raw.some(value => !Number.isInteger(value) || value < 0 || value > 255))
  )
    throw new AuditLogExportError();
  return new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function useAuditExport() {
  const audit = useAuditLogging();
  const browser = inject(WindowService);
  const toaster = useToaster();
  const request = useAuditRequest<ExportAuditLogsOutput>(audit.context);
  async function exportToExcel(
    read: (signal: AbortSignal) => Promise<ExportAuditLogsOutput>,
  ): Promise<void> {
    if (
      request.loading.value ||
      !audit.allowed.value ||
      !audit.permission.isGranted(AuditLoggingPolicyNames.Export)
    )
      return;
    const context = audit.context.value;
    const output = await request.run(read);
    if (context !== audit.context.value) return;
    if (request.failed.value) {
      toaster.error('AbpAuditLogging::ExportFailed');
      return;
    }
    if (!output) return;
    if (output.isBackgroundJob) {
      toaster.info(output.message ?? 'AbpAuditLogging::Exporting');
      return;
    }
    if (!output.fileData?.length && output.message) {
      toaster.info(output.message);
      return;
    }
    try {
      browser.downloadBlob(auditExportFile(output), output.fileName ?? '');
      toaster.success('AbpAuditLogging::ExportCompleted');
    } catch {
      toaster.error('AbpAuditLogging::ExportFailed');
    }
  }
  return { exporting: request.loading, exportToExcel };
}
