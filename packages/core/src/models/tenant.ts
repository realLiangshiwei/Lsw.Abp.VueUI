/**
 * The host name named a tenant the backend does not know, or will not talk about. The
 * application cannot go on as if it were the host: everything it then showed would
 * belong to somebody else.
 */
export class TenantNotFoundError extends Error {
  readonly tenancyName: string;

  constructor(tenancyName: string, options?: { cause?: unknown }) {
    super(
      `There is no tenant named "${tenancyName}".\n` +
        '  The name comes from the placeholder in environment.application.baseUrl, so\n' +
        '  either the address is wrong or the tenant was renamed or deleted.',
      options as ErrorOptions,
    );
    this.name = 'TenantNotFoundError';
    this.tenancyName = tenancyName;
  }
}
