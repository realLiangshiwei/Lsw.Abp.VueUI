import type { RestConfig } from '@lsw-abpvue/core';
import type { GetIdentityUsersInput, IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { computed, shallowRef } from 'vue';
import type {
  IdentityUserExportController,
  IdentityUserExportState,
} from '../models/user-export.js';

type IdentityUserExportApi = Pick<
  IdentityUserService,
  'getDownloadToken' | 'getListAsExcelFile' | 'getListAsCsvFile'
>;

export class IdentityUserExportStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityUserExportStateError';
  }
}

export function createIdentityUserExportController(
  api: IdentityUserExportApi,
  download: (blob: Blob, fileName: string) => void,
): IdentityUserExportController {
  const state = shallowRef<IdentityUserExportState>({ status: 'idle' });
  let revision = 0;
  let controller: AbortController | undefined;

  return {
    state: computed(() => state.value),
    async export(format, query) {
      if (state.value.status === 'loading') return;
      const current = ++revision;
      const request = new AbortController();
      controller = request;
      state.value = { status: 'loading', format };
      const config: RestConfig = { signal: request.signal, skipHandleError: true };

      try {
        const snapshot = snapshotIdentityUserExportQuery(query);
        const result = await api.getDownloadToken(config);
        if (request.signal.aborted || current !== revision) return;
        if (typeof result?.token !== 'string' || result.token.trim() === '') {
          throw new IdentityUserExportStateError(
            'The download token response is incomplete. Refresh the export to try again.',
          );
        }
        const input = { ...snapshot, token: result.token };
        const blob =
          format === 'excel'
            ? await api.getListAsExcelFile(input, config)
            : await api.getListAsCsvFile(input, config);
        if (request.signal.aborted || current !== revision) return;
        if (!(blob instanceof Blob) || blob.size === 0) {
          throw new IdentityUserExportStateError(
            'The downloaded user file is empty or incomplete. Refresh the export to try again.',
          );
        }
        const expectedType =
          format === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv';
        if (blob.type.split(';', 1)[0]?.trim().toLowerCase() !== expectedType) {
          throw new IdentityUserExportStateError(
            'The downloaded response is not the requested user file. Refresh the export to try again.',
          );
        }
        download(blob, format === 'excel' ? 'UserList.xlsx' : 'UserList.csv');
        state.value = { status: 'idle' };
      } catch (error: unknown) {
        if (request.signal.aborted || current !== revision) return;
        request.abort();
        state.value = { status: 'error', error };
        throw error;
      }
    },
    reset() {
      controller?.abort();
      controller = undefined;
      revision += 1;
      state.value = { status: 'idle' };
    },
  };
}

function snapshotIdentityUserExportQuery(query: GetIdentityUsersInput): GetIdentityUsersInput {
  return {
    filter: query.filter,
    roleId: query.roleId,
    organizationUnitId: query.organizationUnitId,
    id: query.id,
    userName: query.userName,
    phoneNumber: query.phoneNumber,
    emailAddress: query.emailAddress,
    name: query.name,
    surname: query.surname,
    isLockedOut: query.isLockedOut,
    notActive: query.notActive,
    emailConfirmed: query.emailConfirmed,
    isExternal: query.isExternal,
    maxCreationTime: query.maxCreationTime,
    minCreationTime: query.minCreationTime,
    maxModifitionTime: query.maxModifitionTime,
    minModifitionTime: query.minModifitionTime,
    sorting: query.sorting,
    extraProperties: query.extraProperties ? structuredClone(query.extraProperties) : undefined,
  };
}
