import type { GetAuditLogListDto, GetEntityChangesDto } from '@lsw-abpvue/audit-logging/proxy';

export type AuditFilterDraft = Record<string, string | null | undefined>;

export function validAuditFilters(draft: AuditFilterDraft, changes = false): boolean {
  const start = draft[changes ? 'startDate' : 'startTime'];
  const end = draft[changes ? 'endDate' : 'endTime'];
  const min = draft.minExecutionDuration;
  const max = draft.maxExecutionDuration;
  return (
    (!start || Number.isFinite(Date.parse(start))) &&
    (!end || Number.isFinite(Date.parse(end))) &&
    (!start || !end || Date.parse(start) <= Date.parse(end)) &&
    [min, max].every(
      value =>
        !value ||
        (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 2147483647),
    ) &&
    (!min || !max || Number(min) <= Number(max))
  );
}

function text(draft: AuditFilterDraft): Record<string, string> {
  return Object.fromEntries(
    Object.entries(draft).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '',
    ),
  );
}

export function auditLogQuery(draft: AuditFilterDraft): GetAuditLogListDto {
  return {
    ...text(draft),
    startTime: draft.startTime ? new Date(draft.startTime).toISOString() : undefined,
    endTime: draft.endTime ? new Date(draft.endTime).toISOString() : undefined,
    minExecutionDuration: draft.minExecutionDuration
      ? Number(draft.minExecutionDuration)
      : undefined,
    maxExecutionDuration: draft.maxExecutionDuration
      ? Number(draft.maxExecutionDuration)
      : undefined,
    httpStatusCode: draft.httpStatusCode ? Number(draft.httpStatusCode) : undefined,
    hasException: draft.hasException ? draft.hasException === 'true' : undefined,
  };
}

export function entityChangeQuery(draft: AuditFilterDraft): GetEntityChangesDto {
  return {
    entityId: draft.entityId || undefined,
    entityTypeFullName: draft.entityTypeFullName || undefined,
    entityChangeType: draft.entityChangeType ? Number(draft.entityChangeType) : undefined,
    startDate: draft.startDate ? new Date(`${draft.startDate}T00:00:00`).toISOString() : undefined,
    endDate: draft.endDate ? new Date(`${draft.endDate}T23:59:59.999`).toISOString() : undefined,
  };
}
