export class AuditLogResponseError extends Error {
  constructor() {
    super(
      'The audit response does not match the selected record. Refresh the record to try again.',
    );
    this.name = 'AuditLogResponseError';
  }
}
