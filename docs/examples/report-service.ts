import { defineService, inject, RestService, type ServiceOf } from '@lsw-abpvue/core';

export const ReportService = defineService('ReportService', () => {
  const rest = inject(RestService);

  return {
    get: (year: number) =>
      rest.request<never, { total: number }>({
        method: 'GET',
        url: '/api/app/report',
        params: { year },
      }),
  };
});

export type ReportService = ServiceOf<typeof ReportService>;
