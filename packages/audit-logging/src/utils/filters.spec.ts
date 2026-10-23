import { describe, expect, it } from 'vitest';
import { auditLogQuery, entityChangeQuery, validAuditFilters } from './filters.js';
import { auditExportFile } from './use-audit-export.js';

describe('audit query boundaries', () => {
  it('preserves false and numeric zero while omitting cleared filters', () => {
    expect(
      auditLogQuery({
        hasException: 'false',
        httpStatusCode: '200',
        minExecutionDuration: '0',
        url: '',
      }),
    ).toMatchObject({ hasException: false, httpStatusCode: 200, minExecutionDuration: 0 });
    expect(auditLogQuery({ hasException: null }).hasException).toBeUndefined();
    expect(entityChangeQuery({ entityChangeType: '0' }).entityChangeType).toBe(0);
  });
  it('converts local datetime values to instants and includes an entire entity change date', () => {
    expect(auditLogQuery({ startTime: '2026-10-20T09:30' }).startTime).toBe(
      new Date('2026-10-20T09:30').toISOString(),
    );
    const query = entityChangeQuery({ startDate: '2026-10-20', endDate: '2026-10-20' });
    expect(query.startDate).toBe(new Date('2026-10-20T00:00:00').toISOString());
    expect(query.endDate).toBe(new Date('2026-10-20T23:59:59.999').toISOString());
  });
  it.each([
    { startTime: 'invalid' },
    { startTime: '2026-10-21', endTime: '2026-10-20' },
    { minExecutionDuration: '-1' },
    { minExecutionDuration: '0.5' },
    { maxExecutionDuration: '2147483648' },
    { minExecutionDuration: 'NaN' },
    { minExecutionDuration: '20', maxExecutionDuration: '10' },
  ])('rejects invalid date and duration ranges', draft => {
    expect(validAuditFilters(draft)).toBe(false);
  });
  it('accepts open date ranges and empty filters', () => {
    expect(validAuditFilters({})).toBe(true);
    expect(validAuditFilters({ endTime: '2026-10-20' })).toBe(true);
    expect(validAuditFilters({ startDate: '2026-10-21', endDate: '2026-10-20' }, true)).toBe(false);
  });
});

describe('audit Excel file decoding', () => {
  it.each(['UEs=', [80, 75]])(
    'decodes base64 and byte arrays into actual file bytes',
    async fileData => {
      const file = auditExportFile({ fileName: 'logs.xlsx', fileData, isBackgroundJob: false });
      expect(file.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect([...new Uint8Array(await file.arrayBuffer())]).toEqual([80, 75]);
    },
  );
  it.each([undefined, '', [], [-1], [256], [1.5], '%%%'])(
    'rejects incomplete or invalid export content',
    fileData => {
      expect(() =>
        auditExportFile({ fileName: 'logs.xlsx', fileData, isBackgroundJob: false }),
      ).toThrow('The audit export response');
    },
  );
});
