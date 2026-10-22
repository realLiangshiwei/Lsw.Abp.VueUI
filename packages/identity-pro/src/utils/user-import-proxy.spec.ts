import { createInjector, RestService } from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { expect, it, vi } from 'vitest';
import { createIdentityUserImportController } from './user-import.js';

it('sends CSV type through the generated multipart proxy', async () => {
  const request = vi
    .fn()
    .mockResolvedValue({ allCount: 1, succeededCount: 1, failedCount: 0, isAllSucceeded: true });
  const injector = createInjector([{ provide: RestService, useValue: { request } }]);
  try {
    const importer = createIdentityUserImportController(injector.get(IdentityUserService), vi.fn());
    await importer.importFile(
      new File(['UserName,Email'], 'users.csv', { type: 'text/csv' }),
      'csv',
    );
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ params: { fileType: '2' }, body: expect.any(FormData) }),
      expect.objectContaining({ apiName: 'AbpIdentity' }),
    );
  } finally {
    injector.destroy();
  }
});
