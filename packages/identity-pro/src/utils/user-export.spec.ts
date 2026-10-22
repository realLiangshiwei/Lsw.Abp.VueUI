import type { RestConfig } from '@lsw-abpvue/core';
import type {
  DownloadTokenResultDto,
  GetIdentityUserListAsFileInput,
  GetIdentityUsersInput,
} from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it, vi } from 'vitest';
import { createIdentityUserExportController, IdentityUserExportStateError } from './user-export.js';

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function api() {
  return {
    getDownloadToken: vi.fn<(_config?: RestConfig) => Promise<DownloadTokenResultDto>>(() =>
      Promise.resolve({ token: 'fresh-token' }),
    ),
    getListAsExcelFile: vi.fn<
      (_input: GetIdentityUserListAsFileInput, _config?: RestConfig) => Promise<Blob>
    >(() =>
      Promise.resolve(
        new Blob(['workbook'], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      ),
    ),
    getListAsCsvFile: vi.fn<
      (_input: GetIdentityUserListAsFileInput, _config?: RestConfig) => Promise<Blob>
    >(() => Promise.resolve(new Blob(['header;value'], { type: 'text/csv' }))),
  };
}

describe('commercial user export controller', () => {
  it.each([
    ['excel', 'UserList.xlsx', 'getListAsExcelFile', 'getListAsCsvFile'],
    ['csv', 'UserList.csv', 'getListAsCsvFile', 'getListAsExcelFile'],
  ] as const)(
    'downloads %s through its binary proxy with the commercial filename',
    async (format, fileName, method, otherMethod) => {
      const service = api();
      const download = vi.fn();
      const controller = createIdentityUserExportController(service, download);
      expect(controller.state.value).toEqual({ status: 'idle' });
      await controller.export(format, { notActive: false });

      expect(service.getDownloadToken).toHaveBeenCalledExactlyOnceWith({
        signal: expect.any(AbortSignal),
        skipHandleError: true,
      });
      expect(service[method]).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ token: 'fresh-token', notActive: false }),
        service.getDownloadToken.mock.calls[0]?.[0],
      );
      expect(service[otherMethod]).not.toHaveBeenCalled();
      expect(download).toHaveBeenCalledExactlyOnceWith(expect.any(Blob), fileName);
      expect(controller.state.value).toEqual({ status: 'idle' });
    },
  );

  it('captures all applied filters and sorting while omitting paging and unknown root fields', async () => {
    const service = api();
    const controller = createIdentityUserExportController(service, vi.fn());
    const query = {
      filter: 'search text',
      roleId: 'role',
      organizationUnitId: 'unit',
      id: 'user',
      userName: 'exact-name',
      phoneNumber: '+1 555 0101',
      emailAddress: 'name+tag@example.test',
      name: 'Name',
      surname: 'Surname',
      isLockedOut: false,
      notActive: false,
      emailConfirmed: false,
      isExternal: true,
      maxCreationTime: '2026-10-22',
      minCreationTime: '2026-10-20',
      maxModifitionTime: '2026-10-24T00:00:00+08:00',
      minModifitionTime: '2026-10-21T00:00:00Z',
      sorting: 'userName DESC',
      extraProperties: { Department: 'QA', Disabled: false, Empty: null },
      skipCount: 30,
      maxResultCount: 10,
      unexpected: 'must not pass',
      token: 'must not reuse',
    };
    await controller.export('csv', query);
    const input = service.getListAsCsvFile.mock.calls[0]?.[0];
    const { skipCount, maxResultCount, unexpected, token, ...expected } = query;
    expect(input).toEqual({ ...expected, token: 'fresh-token' });
    expect(input).not.toHaveProperty('skipCount');
    expect(input).not.toHaveProperty('maxResultCount');
    expect(input).not.toHaveProperty('unexpected');
    expect(query).toMatchObject({ skipCount, maxResultCount, unexpected, token });
  });

  it('deeply snapshots extension values before awaiting a download token', async () => {
    const service = api();
    const token = deferred<DownloadTokenResultDto>();
    service.getDownloadToken.mockReturnValueOnce(token.promise);
    const controller = createIdentityUserExportController(service, vi.fn());
    const nested = { values: ['original'] };
    const query: GetIdentityUsersInput = {
      filter: 'original',
      notActive: false,
      extraProperties: { Department: 'QA', Nested: nested },
    };
    const exported = controller.export('excel', query);
    query.filter = 'changed';
    query.notActive = true;
    if (query.extraProperties) query.extraProperties.Department = 'changed';
    nested.values.push('changed');
    token.resolve({ token: 'captured-token' });
    await exported;

    expect(service.getListAsExcelFile).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: 'original',
        notActive: false,
        extraProperties: { Department: 'QA', Nested: { values: ['original'] } },
      }),
      expect.anything(),
    );
  });

  it('preserves absent and explicit null filters without restoring default active filtering', async () => {
    const service = api();
    const controller = createIdentityUserExportController(service, vi.fn());
    await controller.export('csv', { emailConfirmed: null, notActive: null });
    expect(service.getListAsCsvFile.mock.calls[0]?.[0]).toMatchObject({
      notActive: null,
      emailConfirmed: null,
    });
    await controller.export('csv', {});
    expect(service.getListAsCsvFile.mock.calls[1]?.[0].notActive).toBeUndefined();
  });

  it('ignores repeated format selection while busy and obtains a fresh token for each later export', async () => {
    const service = api();
    const token = deferred<DownloadTokenResultDto>();
    service.getDownloadToken.mockReturnValueOnce(token.promise);
    const controller = createIdentityUserExportController(service, vi.fn());
    const first = controller.export('csv', { filter: 'first' });
    expect(controller.state.value).toEqual({ status: 'loading', format: 'csv' });
    await controller.export('excel', { filter: 'ignored' });
    expect(service.getDownloadToken).toHaveBeenCalledTimes(1);
    token.resolve({ token: 'first-token' });
    await first;
    await controller.export('excel', { filter: 'second' });
    expect(service.getDownloadToken).toHaveBeenCalledTimes(2);
    expect(service.getListAsExcelFile).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'fresh-token', filter: 'second' }),
      expect.anything(),
    );
  });

  it.each([undefined, null, {}, { token: '' }, { token: '  ' }])(
    'rejects an incomplete download token without attempting a binary download',
    async result => {
      const service = api();
      service.getDownloadToken.mockResolvedValueOnce(result as DownloadTokenResultDto);
      const download = vi.fn();
      const controller = createIdentityUserExportController(service, download);
      await expect(controller.export('csv', {})).rejects.toBeInstanceOf(
        IdentityUserExportStateError,
      );
      expect(controller.state.value).toEqual({
        status: 'error',
        error: expect.any(IdentityUserExportStateError),
      });
      expect(service.getListAsCsvFile).not.toHaveBeenCalled();
      expect(download).not.toHaveBeenCalled();
    },
  );

  it.each(['getDownloadToken', 'getListAsCsvFile'] as const)(
    'retains a visible failure from %s and retries only on an explicit new export',
    async method => {
      const service = api();
      const failure = new TypeError('The API is unavailable.');
      service[method].mockRejectedValueOnce(failure);
      const download = vi.fn();
      const controller = createIdentityUserExportController(service, download);
      await expect(controller.export('csv', {})).rejects.toBe(failure);
      expect(controller.state.value).toEqual({ status: 'error', error: failure });
      expect(service.getDownloadToken.mock.calls[0]?.[0]?.signal?.aborted).toBe(true);
      expect(download).not.toHaveBeenCalled();
      await controller.export('csv', {});
      expect(service.getDownloadToken).toHaveBeenCalledTimes(2);
      expect(download).toHaveBeenCalledTimes(1);
    },
  );

  it('cancels a pending token and discards its late completion', async () => {
    const service = api();
    const token = deferred<DownloadTokenResultDto>();
    service.getDownloadToken.mockReturnValueOnce(token.promise);
    const download = vi.fn();
    const controller = createIdentityUserExportController(service, download);
    const exported = controller.export('excel', {});
    controller.reset();
    expect(service.getDownloadToken.mock.calls[0]?.[0]?.signal?.aborted).toBe(true);
    token.resolve({ token: 'obsolete' });
    await exported;
    expect(controller.state.value).toEqual({ status: 'idle' });
    expect(service.getListAsExcelFile).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
  });

  it('discards a late file without overwriting a newer export after a context reset', async () => {
    const service = api();
    const firstFile = deferred<Blob>();
    const secondToken = deferred<DownloadTokenResultDto>();
    service.getListAsExcelFile.mockReturnValueOnce(firstFile.promise);
    service.getDownloadToken
      .mockResolvedValueOnce({ token: 'first' })
      .mockReturnValueOnce(secondToken.promise);
    const download = vi.fn();
    const controller = createIdentityUserExportController(service, download);
    const first = controller.export('excel', {});
    await vi.waitFor(() => expect(service.getListAsExcelFile).toHaveBeenCalledTimes(1));
    controller.reset();
    const second = controller.export('csv', {});
    firstFile.resolve(new Blob(['old context']));
    await first;
    expect(controller.state.value).toEqual({ status: 'loading', format: 'csv' });
    expect(download).not.toHaveBeenCalled();
    secondToken.resolve({ token: 'second' });
    await second;
    expect(download).toHaveBeenCalledExactlyOnceWith(expect.any(Blob), 'UserList.csv');
  });

  it('silently ignores a cancellation rejection after reset', async () => {
    const service = api();
    const token = deferred<DownloadTokenResultDto>();
    service.getDownloadToken.mockReturnValueOnce(token.promise);
    const controller = createIdentityUserExportController(service, vi.fn());
    const exported = controller.export('csv', {});
    controller.reset();
    token.reject(new DOMException('Aborted', 'AbortError'));
    await expect(exported).resolves.toBeUndefined();
    expect(controller.state.value).toEqual({ status: 'idle' });
  });

  it.each([new Blob(), undefined])('rejects an empty or malformed file', async blob => {
    const service = api();
    service.getListAsCsvFile.mockResolvedValueOnce(blob as Blob);
    const download = vi.fn();
    const controller = createIdentityUserExportController(service, download);
    await expect(controller.export('csv', {})).rejects.toBeInstanceOf(IdentityUserExportStateError);
    expect(download).not.toHaveBeenCalled();
  });

  it.each([
    ['excel', 'text/html'],
    ['csv', 'text/html'],
    ['excel', 'text/csv'],
    ['csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['excel', 'application/octet-stream'],
    ['csv', ''],
  ] as const)('rejects %s responses with an unexpected %s content type', async (format, type) => {
    const service = api();
    const blob = new Blob(['<html>Sign in</html>'], { type });
    service.getListAsExcelFile.mockResolvedValueOnce(blob);
    service.getListAsCsvFile.mockResolvedValueOnce(blob);
    const download = vi.fn();
    const controller = createIdentityUserExportController(service, download);
    await expect(controller.export(format, {})).rejects.toBeInstanceOf(
      IdentityUserExportStateError,
    );
    expect(controller.state.value).toEqual({
      status: 'error',
      error: expect.any(IdentityUserExportStateError),
    });
    expect(download).not.toHaveBeenCalled();
  });

  it('accepts the expected file MIME type with a charset parameter and different casing', async () => {
    const service = api();
    const blob = new Blob(['header;value'], { type: 'TEXT/CSV; charset=utf-8' });
    service.getListAsCsvFile.mockResolvedValueOnce(blob);
    const download = vi.fn();
    await createIdentityUserExportController(service, download).export('csv', {});
    expect(download).toHaveBeenCalledExactlyOnceWith(blob, 'UserList.csv');
  });

  it('retains a browser download failure and clears the error when reset', async () => {
    const service = api();
    const failure = new TypeError('The browser could not start the download.');
    const controller = createIdentityUserExportController(
      service,
      vi.fn(() => {
        throw failure;
      }),
    );
    await expect(controller.export('csv', {})).rejects.toBe(failure);
    expect(controller.state.value).toEqual({ status: 'error', error: failure });
    controller.reset();
    expect(controller.state.value).toEqual({ status: 'idle' });
  });
});
