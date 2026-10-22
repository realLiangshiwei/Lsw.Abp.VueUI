import type { RestConfig } from '@lsw-abpvue/core';
import type {
  DownloadTokenResultDto,
  GetImportInvalidUsersFileInput,
  GetImportUsersSampleFileInput,
  ImportUsersFromFileOutput,
} from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it, vi } from 'vitest';
import type { IdentityUserImportFormat } from '../models/user-import.js';
import {
  createIdentityUserImportController,
  getIdentityUserImportFileError,
  IdentityUserImportStateError,
} from './user-import.js';

const workbookMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function output(overrides: Partial<ImportUsersFromFileOutput> = {}): ImportUsersFromFileOutput {
  return {
    allCount: 3,
    succeededCount: 1,
    failedCount: 2,
    isAllSucceeded: false,
    invalidUsersDownloadToken: 'result-file-token',
    ...overrides,
  };
}

function userFile(format: IdentityUserImportFormat = 'csv'): File {
  return new File(['synthetic user records'], format === 'excel' ? 'users.xlsx' : 'users.csv');
}

function api() {
  return {
    getDownloadToken: vi.fn<(_config?: RestConfig) => Promise<DownloadTokenResultDto>>(() =>
      Promise.resolve({ token: 'fresh-template-token' }),
    ),
    getImportUsersSampleFile: vi.fn<
      (_input: GetImportUsersSampleFileInput, _config?: RestConfig) => Promise<Blob>
    >(input =>
      Promise.resolve(
        new Blob(['sample file'], { type: input.fileType === 1 ? workbookMime : 'text/csv' }),
      ),
    ),
    importUsersFromFile: vi.fn<
      (_input: FormData, _config?: RestConfig) => Promise<ImportUsersFromFileOutput>
    >(() => Promise.resolve(output())),
    getImportInvalidUsersFile: vi.fn<
      (_input: GetImportInvalidUsersFileInput, _config?: RestConfig) => Promise<Blob>
    >(() => Promise.resolve(new Blob(['failed file'], { type: 'text/csv' }))),
  };
}

describe('commercial user import files', () => {
  it.each([
    [undefined, 'csv', 'required'],
    [new File(['data'], 'users.CSV'), 'csv', undefined],
    [new File(['data'], 'users.XLSX'), 'excel', undefined],
    [new File(['data'], 'users.xlsx'), 'csv', 'type'],
    [new File(['data'], 'users.csv.exe'), 'csv', 'type'],
    [new File(['data'], 'users.xls'), 'excel', 'type'],
    [new File([], 'users.csv'), 'csv', 'empty'],
    [new File([], 'users.xlsx'), 'excel', 'empty'],
  ] as const)('validates the selected file without parsing user content', (file, format, error) => {
    expect(getIdentityUserImportFileError(file, format)).toBe(error);
  });

  it('uses extension and nonzero size without inventing MIME or size restrictions', () => {
    expect(getIdentityUserImportFileError(new File(['data'], 'users.csv'), 'csv')).toBeUndefined();
    expect(
      getIdentityUserImportFileError(
        new File(['data'], 'users.xlsx', { type: 'application/octet-stream' }),
        'excel',
      ),
    ).toBeUndefined();
  });
});

describe('commercial user import controller', () => {
  it.each([
    ['excel', 1, 'ImportUsersSampleFile.xlsx'],
    ['csv', 2, 'ImportUsersSampleFile.csv'],
  ] as const)(
    'downloads the %s template with a fresh token for every action',
    async (format, value, name) => {
      const service = api();
      const download = vi.fn();
      const controller = createIdentityUserImportController(service, download);
      await controller.downloadSample(format);
      await controller.downloadSample(format);

      expect(service.getDownloadToken).toHaveBeenCalledTimes(2);
      expect(service.getImportUsersSampleFile).toHaveBeenCalledTimes(2);
      expect(service.getImportUsersSampleFile).toHaveBeenCalledWith(
        { fileType: value, token: 'fresh-template-token' },
        service.getDownloadToken.mock.calls[0]?.[0],
      );
      expect(service.getDownloadToken.mock.calls[0]?.[0]).toEqual({
        signal: expect.any(AbortSignal),
        skipHandleError: true,
      });
      expect(download).toHaveBeenCalledWith(expect.any(Blob), name);
      expect(service.importUsersFromFile).not.toHaveBeenCalled();
      expect(service.getImportInvalidUsersFile).not.toHaveBeenCalled();
      expect(controller.state.value.result).toBeUndefined();
      expect(controller.state.value).not.toHaveProperty('token');
    },
  );

  it.each([
    ['excel', '1'],
    ['csv', '2'],
  ] as const)(
    'uploads %s as the real multipart file and fileType fields without a download token',
    async (format, fileType) => {
      const service = api();
      const download = vi.fn();
      const controller = createIdentityUserImportController(service, download);
      const file = userFile(format);
      const result = await controller.importFile(file, format);
      const [form, config] = service.importUsersFromFile.mock.calls[0] ?? [];

      expect(form).toBeInstanceOf(FormData);
      expect([...(form?.keys() ?? [])]).toEqual(['file', 'fileType']);
      expect(form?.get('file')).toBeInstanceOf(File);
      expect((form?.get('file') as File).name).toBe(file.name);
      expect((form?.get('file') as File).size).toBe(file.size);
      expect(form?.get('fileType')).toBe(fileType);
      expect(config).toEqual({ signal: expect.any(AbortSignal), skipHandleError: true });
      expect(service.getDownloadToken).not.toHaveBeenCalled();
      expect(download).not.toHaveBeenCalled();
      expect(result).toEqual({ format, output: output() });
      expect(controller.state.value.result).toBe(result);
    },
  );

  it.each([
    output(),
    output({ allCount: 1, succeededCount: 0, failedCount: 1 }),
    output({
      allCount: 1,
      succeededCount: 1,
      failedCount: 0,
      isAllSucceeded: true,
      invalidUsersDownloadToken: undefined,
    }),
    output({
      allCount: 0,
      succeededCount: 0,
      failedCount: 0,
      isAllSucceeded: true,
      invalidUsersDownloadToken: undefined,
    }),
    output({ allCount: 4 }),
    output({ isAllSucceeded: true }),
    output({ allCount: 1, succeededCount: 1, failedCount: 0 }),
  ])(
    'retains the server counts and prevents a second write after a completed batch',
    async response => {
      const service = api();
      service.importUsersFromFile.mockResolvedValueOnce(response);
      const controller = createIdentityUserImportController(service, vi.fn());
      const result = await controller.importFile(userFile(), 'csv');
      expect(result?.output).toEqual(response);
      expect(await controller.importFile(userFile('excel'), 'excel')).toBeUndefined();
      expect(service.importUsersFromFile).toHaveBeenCalledTimes(1);
      expect(service.getImportInvalidUsersFile).not.toHaveBeenCalled();
    },
  );

  it('keeps the received result independent from later API response mutations', async () => {
    const response = output();
    const service = api();
    service.importUsersFromFile.mockResolvedValueOnce(response);
    const controller = createIdentityUserImportController(service, vi.fn());
    await controller.importFile(userFile(), 'csv');
    response.succeededCount = 100;
    response.invalidUsersDownloadToken = 'changed-token';
    expect(controller.state.value.result?.output).toEqual(output());
  });

  it.each([
    ['excel', workbookMime, 'InvalidUsers.xlsx'],
    ['csv', 'text/csv', 'InvalidUsers.csv'],
  ] as const)(
    'downloads failed %s records with the result token and original batch format',
    async (format, mime, name) => {
      const service = api();
      service.getImportInvalidUsersFile.mockResolvedValue(new Blob(['errors'], { type: mime }));
      const download = vi.fn();
      const controller = createIdentityUserImportController(service, download);
      await controller.importFile(userFile(format), format);
      const result = controller.state.value.result;
      await controller.downloadSample(format === 'excel' ? 'csv' : 'excel');
      await controller.downloadInvalid();

      expect(service.getImportInvalidUsersFile).toHaveBeenCalledExactlyOnceWith(
        { token: 'result-file-token' },
        { signal: expect.any(AbortSignal), skipHandleError: true },
      );
      expect(service.getDownloadToken).toHaveBeenCalledTimes(1);
      expect(download).toHaveBeenLastCalledWith(expect.any(Blob), name);
      expect(controller.state.value.result).toBe(result);
    },
  );

  it.each([undefined, '', '  '])(
    'does not request a failed file when its token is absent',
    async token => {
      const service = api();
      service.importUsersFromFile.mockResolvedValueOnce(
        output({ invalidUsersDownloadToken: token }),
      );
      const controller = createIdentityUserImportController(service, vi.fn());
      await controller.downloadInvalid();
      await controller.importFile(userFile(), 'csv');
      await controller.downloadInvalid();
      expect(service.getImportInvalidUsersFile).not.toHaveBeenCalled();
      expect(controller.state.value.result?.output.failedCount).toBe(2);
    },
  );

  it.each([null, 123, {}, [], false])(
    'retains valid counts without publishing a malformed failed-record token',
    async token => {
      const service = api();
      service.importUsersFromFile.mockResolvedValueOnce({
        ...output(),
        invalidUsersDownloadToken: token,
      } as ImportUsersFromFileOutput);
      const controller = createIdentityUserImportController(service, vi.fn());
      const result = await controller.importFile(userFile(), 'csv');
      expect(result?.output).toEqual(output({ invalidUsersDownloadToken: undefined }));
      await controller.downloadInvalid();
      expect(service.getImportInvalidUsersFile).not.toHaveBeenCalled();
      expect(await controller.importFile(userFile(), 'csv')).toBeUndefined();
      expect(service.importUsersFromFile).toHaveBeenCalledTimes(1);
    },
  );

  it('does not download an invalid file after an all-success result', async () => {
    const service = api();
    service.importUsersFromFile.mockResolvedValueOnce(
      output({ allCount: 1, succeededCount: 1, failedCount: 0, isAllSucceeded: true }),
    );
    const controller = createIdentityUserImportController(service, vi.fn());
    await controller.importFile(userFile(), 'csv');
    await controller.downloadInvalid();
    expect(service.getImportInvalidUsersFile).not.toHaveBeenCalled();
  });

  it('blocks every competing action while a template is pending', async () => {
    const service = api();
    const token = deferred<DownloadTokenResultDto>();
    service.getDownloadToken.mockReturnValueOnce(token.promise);
    const controller = createIdentityUserImportController(service, vi.fn());
    const pending = controller.downloadSample('excel');
    expect(controller.state.value).toMatchObject({ status: 'loading', operation: 'sample' });
    await controller.downloadSample('csv');
    await controller.importFile(userFile(), 'csv');
    await controller.downloadInvalid();
    expect(service.getDownloadToken).toHaveBeenCalledTimes(1);
    expect(service.importUsersFromFile).not.toHaveBeenCalled();
    token.resolve({ token: 'finished-token' });
    await pending;
  });

  it('blocks competing operations during an upload and during a failed-record download', async () => {
    const service = api();
    const response = deferred<ImportUsersFromFileOutput>();
    service.importUsersFromFile.mockReturnValueOnce(response.promise);
    const invalid = deferred<Blob>();
    service.getImportInvalidUsersFile.mockReturnValueOnce(invalid.promise);
    const controller = createIdentityUserImportController(service, vi.fn());
    const uploading = controller.importFile(userFile(), 'csv');
    await controller.importFile(userFile(), 'csv');
    await controller.downloadSample('excel');
    expect(service.importUsersFromFile).toHaveBeenCalledTimes(1);
    expect(service.getDownloadToken).not.toHaveBeenCalled();
    response.resolve(output());
    await uploading;
    const downloading = controller.downloadInvalid();
    await controller.downloadInvalid();
    await controller.downloadSample('csv');
    expect(service.getImportInvalidUsersFile).toHaveBeenCalledTimes(1);
    expect(service.getDownloadToken).not.toHaveBeenCalled();
    invalid.resolve(new Blob(['errors'], { type: 'text/csv' }));
    await downloading;
  });

  it.each([undefined, null, {}, { token: '' }, { token: '  ' }])(
    'rejects an incomplete template token without requesting a file',
    async result => {
      const service = api();
      service.getDownloadToken.mockResolvedValueOnce(result as DownloadTokenResultDto);
      const controller = createIdentityUserImportController(service, vi.fn());
      await expect(controller.downloadSample('csv')).rejects.toBeInstanceOf(
        IdentityUserImportStateError,
      );
      expect(controller.state.value).toMatchObject({ status: 'error', operation: 'sample' });
      expect(service.getImportUsersSampleFile).not.toHaveBeenCalled();
    },
  );

  it.each(['sample', 'invalid'] as const)(
    'rejects a login HTML response from the %s download',
    async operation => {
      const service = api();
      const method =
        operation === 'sample'
          ? service.getImportUsersSampleFile
          : service.getImportInvalidUsersFile;
      method.mockResolvedValueOnce(new Blob(['login'], { type: 'text/html' }));
      const download = vi.fn();
      const controller = createIdentityUserImportController(service, download);
      if (operation === 'invalid') await controller.importFile(userFile(), 'csv');
      await expect(
        operation === 'sample' ? controller.downloadSample('csv') : controller.downloadInvalid(),
      ).rejects.toBeInstanceOf(IdentityUserImportStateError);
      expect(download).not.toHaveBeenCalled();
      expect(controller.state.value).toMatchObject({ status: 'error', operation });
      expect(Boolean(controller.state.value.result)).toBe(operation === 'invalid');
    },
  );

  it.each([new Blob(), new Blob(['data']), new Blob(['data'], { type: workbookMime }), undefined])(
    'rejects an empty, untyped or wrong-format CSV template',
    async blob => {
      const service = api();
      service.getImportUsersSampleFile.mockResolvedValueOnce(blob as Blob);
      const download = vi.fn();
      const controller = createIdentityUserImportController(service, download);
      await expect(controller.downloadSample('csv')).rejects.toBeInstanceOf(
        IdentityUserImportStateError,
      );
      expect(download).not.toHaveBeenCalled();
    },
  );

  it('accepts CSV content type parameters without broadening the MIME contract', async () => {
    const service = api();
    service.getImportUsersSampleFile.mockResolvedValueOnce(
      new Blob(['sample'], { type: 'Text/CSV; charset=utf-8' }),
    );
    const download = vi.fn();
    const controller = createIdentityUserImportController(service, download);
    await controller.downloadSample('csv');
    expect(download).toHaveBeenCalledTimes(1);
  });

  it.each([
    undefined,
    null,
    {},
    output({ allCount: -1 }),
    output({ succeededCount: 0.5 }),
    output({ failedCount: Number.NaN }),
    output({ allCount: Number.POSITIVE_INFINITY }),
    { ...output(), isAllSucceeded: undefined },
    { ...output(), isAllSucceeded: 'true' },
  ])('does not publish import statistics with missing or invalid field types', async response => {
    const service = api();
    service.importUsersFromFile.mockResolvedValueOnce(response as ImportUsersFromFileOutput);
    const controller = createIdentityUserImportController(service, vi.fn());
    await expect(controller.importFile(userFile(), 'csv')).rejects.toBeInstanceOf(
      IdentityUserImportStateError,
    );
    expect(controller.state.value).toMatchObject({ status: 'error', operation: 'upload' });
    expect(controller.state.value.result).toBeUndefined();
    expect(service.importUsersFromFile).toHaveBeenCalledTimes(1);
  });

  it.each([new File([], 'users.csv'), new File(['data'], 'users.xlsx')])(
    'rejects an invalid local file without writing or requesting a token',
    async file => {
      const service = api();
      const controller = createIdentityUserImportController(service, vi.fn());
      await expect(controller.importFile(file, 'csv')).rejects.toBeInstanceOf(
        IdentityUserImportStateError,
      );
      expect(service.importUsersFromFile).not.toHaveBeenCalled();
      expect(service.getDownloadToken).not.toHaveBeenCalled();
    },
  );

  it.each(['getDownloadToken', 'getImportUsersSampleFile'] as const)(
    'retains a template failure from %s and retries only on an explicit action',
    async method => {
      const service = api();
      const failure = new TypeError('The template request failed.');
      service[method].mockRejectedValueOnce(failure);
      const controller = createIdentityUserImportController(service, vi.fn());
      await expect(controller.downloadSample('csv')).rejects.toBe(failure);
      expect(controller.state.value).toMatchObject({
        status: 'error',
        operation: 'sample',
        error: failure,
      });
      expect(service.getDownloadToken).toHaveBeenCalledTimes(1);
      await controller.downloadSample('csv');
      expect(service.getDownloadToken).toHaveBeenCalledTimes(2);
      expect(controller.state.value.status).toBe('idle');
    },
  );

  it('does not automatically retry a failed write and allows a deliberate later upload', async () => {
    const service = api();
    const failure = new TypeError('The response was lost after the upload.');
    service.importUsersFromFile.mockRejectedValueOnce(failure);
    const controller = createIdentityUserImportController(service, vi.fn());
    await expect(controller.importFile(userFile(), 'csv')).rejects.toBe(failure);
    expect(service.importUsersFromFile).toHaveBeenCalledTimes(1);
    expect(controller.state.value).toMatchObject({
      status: 'error',
      operation: 'upload',
      error: failure,
    });
    expect(controller.state.value.result).toBeUndefined();
    await controller.importFile(userFile(), 'csv');
    expect(service.importUsersFromFile).toHaveBeenCalledTimes(2);
  });

  it('preserves the batch result through a failed download and retries with its original token', async () => {
    const service = api();
    const failure = new TypeError('The failed-record token expired.');
    service.getImportInvalidUsersFile.mockRejectedValueOnce(failure);
    const controller = createIdentityUserImportController(service, vi.fn());
    await controller.importFile(userFile(), 'csv');
    const result = controller.state.value.result;
    await expect(controller.downloadInvalid()).rejects.toBe(failure);
    expect(controller.state.value.result).toBe(result);
    expect(controller.state.value).toMatchObject({
      status: 'error',
      operation: 'invalid',
      error: failure,
    });
    await controller.downloadInvalid();
    expect(service.getImportInvalidUsersFile).toHaveBeenCalledTimes(2);
    expect(service.getImportInvalidUsersFile.mock.calls.map(([input]) => input)).toEqual([
      { token: 'result-file-token' },
      { token: 'result-file-token' },
    ]);
    expect(service.getDownloadToken).not.toHaveBeenCalled();
    expect(service.importUsersFromFile).toHaveBeenCalledTimes(1);
    expect(controller.state.value.result).toBe(result);
  });

  it('preserves a completed batch if a later template download fails', async () => {
    const service = api();
    service.getDownloadToken.mockRejectedValueOnce(new TypeError('Unavailable'));
    const controller = createIdentityUserImportController(service, vi.fn());
    await controller.importFile(userFile(), 'csv');
    const result = controller.state.value.result;
    await expect(controller.downloadSample('excel')).rejects.toThrow('Unavailable');
    expect(controller.state.value.result).toBe(result);
    await controller.importFile(userFile(), 'csv');
    expect(service.importUsersFromFile).toHaveBeenCalledTimes(1);
  });

  it('aborts a pending token and discards its late resolution after reset', async () => {
    const service = api();
    const token = deferred<DownloadTokenResultDto>();
    service.getDownloadToken.mockReturnValueOnce(token.promise);
    const download = vi.fn();
    const controller = createIdentityUserImportController(service, download);
    const pending = controller.downloadSample('excel');
    controller.reset();
    expect(service.getDownloadToken.mock.calls[0]?.[0]?.signal?.aborted).toBe(true);
    token.resolve({ token: 'obsolete-template-token' });
    await pending;
    expect(service.getImportUsersSampleFile).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
    expect(controller.state.value).toEqual({ status: 'idle' });
  });

  it('discards a late template without changing a new batch after reset', async () => {
    const service = api();
    const sample = deferred<Blob>();
    service.getImportUsersSampleFile.mockReturnValueOnce(sample.promise);
    const download = vi.fn();
    const controller = createIdentityUserImportController(service, download);
    const pending = controller.downloadSample('csv');
    await vi.waitFor(() => expect(service.getImportUsersSampleFile).toHaveBeenCalledTimes(1));
    controller.reset();
    await controller.importFile(userFile(), 'csv');
    const result = controller.state.value.result;
    sample.resolve(new Blob(['obsolete file'], { type: 'text/csv' }));
    await pending;
    expect(download).not.toHaveBeenCalled();
    expect(controller.state.value.result).toBe(result);
  });

  it('discards a cancelled upload response and permits a new batch after reset', async () => {
    const service = api();
    const response = deferred<ImportUsersFromFileOutput>();
    service.importUsersFromFile.mockReturnValueOnce(response.promise);
    const controller = createIdentityUserImportController(service, vi.fn());
    const pending = controller.importFile(userFile(), 'csv');
    controller.reset();
    expect(service.importUsersFromFile.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    const newResult = await controller.importFile(userFile('excel'), 'excel');
    response.resolve(output());
    expect(await pending).toBeUndefined();
    expect(controller.state.value.result).toBe(newResult);
    expect(newResult?.format).toBe('excel');
  });

  it('discards a late failed-record download and clears the previous token after reset', async () => {
    const service = api();
    const blob = deferred<Blob>();
    service.getImportInvalidUsersFile.mockReturnValueOnce(blob.promise);
    const download = vi.fn();
    const controller = createIdentityUserImportController(service, download);
    await controller.importFile(userFile(), 'csv');
    const pending = controller.downloadInvalid();
    controller.reset();
    expect(service.getImportInvalidUsersFile.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    blob.resolve(new Blob(['old errors'], { type: 'text/csv' }));
    await pending;
    await controller.downloadInvalid();
    expect(download).not.toHaveBeenCalled();
    expect(service.getImportInvalidUsersFile).toHaveBeenCalledTimes(1);
    expect(controller.state.value).toEqual({ status: 'idle' });
  });

  it('ignores a cancelled rejection without replacing a newer operation state', async () => {
    const service = api();
    const response = deferred<ImportUsersFromFileOutput>();
    const token = deferred<DownloadTokenResultDto>();
    service.importUsersFromFile.mockReturnValueOnce(response.promise);
    service.getDownloadToken.mockReturnValueOnce(token.promise);
    const controller = createIdentityUserImportController(service, vi.fn());
    const pending = controller.importFile(userFile(), 'csv');
    controller.reset();
    const current = controller.downloadSample('excel');
    response.reject(new DOMException('Aborted', 'AbortError'));
    await expect(pending).resolves.toBeUndefined();
    expect(controller.state.value).toMatchObject({ status: 'loading', operation: 'sample' });
    token.resolve({ token: 'current-template-token' });
    await current;
  });

  it('retains a completed result when the browser cannot save its failed records file', async () => {
    const service = api();
    const failure = new TypeError('The browser save action failed.');
    const controller = createIdentityUserImportController(service, () => {
      throw failure;
    });
    await controller.importFile(userFile(), 'csv');
    const result = controller.state.value.result;
    await expect(controller.downloadInvalid()).rejects.toBe(failure);
    expect(controller.state.value.result).toBe(result);
    expect(controller.state.value).toMatchObject({ status: 'error', operation: 'invalid' });
  });
});
