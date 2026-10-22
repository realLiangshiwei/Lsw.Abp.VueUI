import type { RestConfig } from '@lsw-abpvue/core';
import type {
  IdentityUserService,
  ImportUsersFromFileOutput,
} from '@lsw-abpvue/identity-pro/proxy';
import { computed, shallowRef } from 'vue';
import type {
  IdentityUserImportController,
  IdentityUserImportFormat,
  IdentityUserImportOperation,
  IdentityUserImportResult,
  IdentityUserImportState,
} from '../models/user-import.js';

type IdentityUserImportApi = Pick<
  IdentityUserService,
  | 'getDownloadToken'
  | 'getImportUsersSampleFile'
  | 'importUsersFromFile'
  | 'getImportInvalidUsersFile'
>;

export class IdentityUserImportStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityUserImportStateError';
  }
}

export function getIdentityUserImportFileError(
  file: File | undefined,
  format: IdentityUserImportFormat,
): 'required' | 'type' | 'empty' | undefined {
  if (!file) return 'required';
  if (!file.name.toLowerCase().endsWith(format === 'excel' ? '.xlsx' : '.csv')) return 'type';
  if (file.size === 0) return 'empty';
  return undefined;
}

export function createIdentityUserImportController(
  api: IdentityUserImportApi,
  download: (blob: Blob, fileName: string) => void,
): IdentityUserImportController {
  const state = shallowRef<IdentityUserImportState>({ status: 'idle' });
  let revision = 0;
  let controller: AbortController | undefined;

  async function execute(
    operation: IdentityUserImportOperation,
    action: (
      config: RestConfig,
      isCurrent: () => boolean,
    ) => Promise<IdentityUserImportResult | undefined>,
  ): Promise<IdentityUserImportResult | undefined> {
    if (state.value.status === 'loading') return undefined;
    const result = state.value.result;
    const current = ++revision;
    const request = new AbortController();
    controller = request;
    state.value = { status: 'loading', operation, result };
    const isCurrent = () => !request.signal.aborted && current === revision;

    try {
      const imported = await action({ signal: request.signal, skipHandleError: true }, isCurrent);
      if (!isCurrent()) return undefined;
      state.value = { status: 'idle', result: imported ?? result };
      return imported;
    } catch (error: unknown) {
      if (!isCurrent()) return undefined;
      request.abort();
      state.value = { status: 'error', operation, result, error };
      throw error;
    } finally {
      if (controller === request) controller = undefined;
    }
  }

  return {
    state: computed(() => state.value),
    async downloadSample(format) {
      await execute('sample', async (config, isCurrent) => {
        const tokenResult = await api.getDownloadToken(config);
        if (!isCurrent()) return undefined;
        if (typeof tokenResult?.token !== 'string' || tokenResult.token.trim() === '') {
          throw new IdentityUserImportStateError(
            'The template download token is incomplete. Download the template again to retry.',
          );
        }
        const blob = await api.getImportUsersSampleFile(
          { fileType: format === 'excel' ? 1 : 2, token: tokenResult.token },
          config,
        );
        if (!isCurrent()) return undefined;
        validateIdentityUserImportDownload(blob, format);
        download(blob, `ImportUsersSampleFile.${format === 'excel' ? 'xlsx' : 'csv'}`);
        return undefined;
      });
    },
    async importFile(file, format) {
      if (state.value.status === 'loading' || state.value.result) return undefined;
      return execute('upload', async (config, isCurrent) => {
        if (getIdentityUserImportFileError(file, format)) {
          throw new IdentityUserImportStateError(
            'The selected user file is missing, empty or has the wrong extension. Select a valid file before uploading.',
          );
        }
        const form = new FormData();
        form.append('file', file, file.name);
        form.append('fileType', format === 'excel' ? '1' : '2');
        const output = await api.importUsersFromFile(form, config);
        if (!isCurrent()) return undefined;
        validateIdentityUserImportOutput(output);
        return {
          format,
          output: {
            allCount: output.allCount,
            succeededCount: output.succeededCount,
            failedCount: output.failedCount,
            isAllSucceeded: output.isAllSucceeded,
            invalidUsersDownloadToken:
              typeof output.invalidUsersDownloadToken === 'string' &&
              output.invalidUsersDownloadToken.trim()
                ? output.invalidUsersDownloadToken
                : undefined,
          },
        };
      });
    },
    async downloadInvalid() {
      const result = state.value.result;
      const token = result?.output.invalidUsersDownloadToken;
      if (
        !result ||
        result.output.failedCount === 0 ||
        typeof token !== 'string' ||
        !token.trim()
      ) {
        return;
      }
      await execute('invalid', async (config, isCurrent) => {
        const blob = await api.getImportInvalidUsersFile({ token }, config);
        if (!isCurrent()) return undefined;
        validateIdentityUserImportDownload(blob, result.format);
        download(blob, `InvalidUsers.${result.format === 'excel' ? 'xlsx' : 'csv'}`);
        return undefined;
      });
    },
    reset() {
      controller?.abort();
      controller = undefined;
      revision += 1;
      state.value = { status: 'idle' };
    },
  };
}

function validateIdentityUserImportDownload(blob: Blob, format: IdentityUserImportFormat): void {
  const mime =
    format === 'excel'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';
  if (
    !(blob instanceof Blob) ||
    blob.size === 0 ||
    blob.type.split(';', 1)[0]?.trim().toLowerCase() !== mime
  ) {
    throw new IdentityUserImportStateError(
      'The downloaded response is not a complete user import file. Retry this download explicitly.',
    );
  }
}

function validateIdentityUserImportOutput(output: ImportUsersFromFileOutput): void {
  if (
    !output ||
    ![output.allCount, output.succeededCount, output.failedCount].every(
      value => Number.isSafeInteger(value) && value >= 0,
    ) ||
    typeof output.isAllSucceeded !== 'boolean'
  ) {
    throw new IdentityUserImportStateError(
      'The user import result is incomplete. Check the user list before uploading again.',
    );
  }
}
