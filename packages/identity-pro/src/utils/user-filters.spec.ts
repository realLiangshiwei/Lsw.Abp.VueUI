import type { RestConfig } from '@lsw-abpvue/core';
import type {
  IdentityRoleLookupDto,
  OrganizationUnitLookupDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it, vi } from 'vitest';
import {
  buildIdentityUserListQuery,
  createIdentityUserAdvancedFilters,
  createIdentityUserFilterLookupLoader,
  filterIdentityUserLookups,
  getIdentityUserDateFilterErrors,
  getIdentityUserTodayDateRange,
  normalizeIdentityUserAdvancedFilters,
} from './user-filters.js';

function api() {
  return {
    getRoleLookup: vi.fn<(_config?: RestConfig) => Promise<IdentityRoleLookupDto[]>>(() =>
      Promise.resolve([{ id: 'role-id', name: 'Readers' }]),
    ),
    getOrganizationUnitLookup: vi.fn<
      (_config?: RestConfig) => Promise<OrganizationUnitLookupDto[]>
    >(() => Promise.resolve([{ id: 'unit-id', displayName: 'Development' }])),
  };
}

describe('commercial user filter query', () => {
  it('starts with active users and creates independent default filters', () => {
    const first = createIdentityUserAdvancedFilters();
    first.name = 'Changed';
    expect(createIdentityUserAdvancedFilters()).toEqual({ notActive: false });
  });

  it('retains explicit false flags and zero GUIDs while omitting empty tri-state values', () => {
    const zero = '00000000-0000-0000-0000-000000000000';
    expect(
      normalizeIdentityUserAdvancedFilters({
        roleId: zero,
        organizationUnitId: null,
        id: zero,
        userName: '',
        name: '  Exact Name  ',
        surname: undefined,
        notActive: null,
        emailConfirmed: false,
        isLockedOut: false,
        isExternal: true,
      }),
    ).toEqual({
      roleId: zero,
      id: zero,
      name: '  Exact Name  ',
      emailConfirmed: false,
      isLockedOut: false,
      isExternal: true,
    });
  });

  it('combines all advanced fields with independent search, paging, sorting and query extensions', () => {
    const filters = {
      roleId: 'role',
      organizationUnitId: 'unit',
      id: 'user',
      userName: 'username',
      name: 'Name',
      surname: 'Surname',
      phoneNumber: '123',
      emailAddress: 'user@example.test',
      notActive: false,
      emailConfirmed: false,
      isLockedOut: true,
      isExternal: true,
      minCreationTime: '2026-10-01',
      maxCreationTime: '2026-10-02',
      minModifitionTime: '2026-10-03T03:04:05+08:00',
      maxModifitionTime: '2026-10-04T08:09:10Z',
      extraProperties: { Department: 'QA', Shared: 'advanced' },
    };
    const query = {
      filter: 'text',
      sorting: 'userName desc',
      skipCount: 20,
      maxResultCount: 10,
      extraProperties: { Company: 'ABP', Shared: 'query' },
    };
    expect(buildIdentityUserListQuery(query, filters)).toEqual({
      ...query,
      ...filters,
      extraProperties: { Company: 'ABP', Department: 'QA', Shared: 'advanced' },
    });
    expect(filters.extraProperties).toEqual({ Department: 'QA', Shared: 'advanced' });
  });

  it('preserves date-only and offset bounds without converting to end-of-day or UTC', () => {
    expect(
      normalizeIdentityUserAdvancedFilters({
        minCreationTime: '2026-10-01',
        maxCreationTime: '2026-10-02',
        minModifitionTime: '2026-10-03T03:04:05+08:00',
        maxModifitionTime: null,
      }),
    ).toEqual({
      minCreationTime: '2026-10-01',
      maxCreationTime: '2026-10-02',
      minModifitionTime: '2026-10-03T03:04:05+08:00',
    });
  });

  it('accepts open or equal date bounds and identifies reversed or invalid ranges', () => {
    expect(getIdentityUserDateFilterErrors({ minCreationTime: '2026-10-01' })).toEqual([]);
    expect(
      getIdentityUserDateFilterErrors({
        minCreationTime: '2026-10-01',
        maxCreationTime: '2026-10-01',
      }),
    ).toEqual([]);
    expect(
      getIdentityUserDateFilterErrors({
        minCreationTime: '2026-10-02',
        maxCreationTime: '2026-10-01',
        maxModifitionTime: 'invalid',
      }),
    ).toEqual(['minCreationTime', 'maxCreationTime', 'maxModifitionTime']);
  });

  it('filters complete lookup arrays locally without dropping a selected value', () => {
    const values = [
      { id: 'selected', label: 'Administrators' },
      { id: 'readers', label: 'Readers' },
      { id: 'writers', label: 'Writers' },
    ];
    expect(filterIdentityUserLookups(values, 'READ', 'selected')).toEqual(values.slice(0, 2));
    expect(filterIdentityUserLookups(values, '')).toEqual(values);
  });

  it('uses local calendar days for Today and handles month and year boundaries', () => {
    expect(getIdentityUserTodayDateRange(new Date(2026, 9, 31, 23, 30))).toEqual({
      from: '2026-10-31',
      to: '2026-11-01',
    });
    expect(getIdentityUserTodayDateRange(new Date(2026, 11, 31, 23, 30))).toEqual({
      from: '2026-12-31',
      to: '2027-01-01',
    });
  });
});

describe('commercial user filter lookups', () => {
  it('reads complete standard lookup endpoints with a shared cancellation signal', async () => {
    const service = api();
    const loader = createIdentityUserFilterLookupLoader(service);
    await loader.load();
    expect(service.getRoleLookup).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ signal: expect.any(AbortSignal), skipHandleError: true }),
    );
    expect(service.getOrganizationUnitLookup).toHaveBeenCalledWith(
      service.getRoleLookup.mock.calls[0]?.[0],
    );
    expect(loader.state.value).toEqual({
      status: 'ready',
      value: {
        roles: [{ id: 'role-id', label: 'Readers' }],
        organizationUnits: [{ id: 'unit-id', label: 'Development' }],
      },
    });
  });

  it('does not replace a newer lookup with an obsolete context response', async () => {
    const service = api();
    let resolveOld: (roles: IdentityRoleLookupDto[]) => void = () => {};
    service.getRoleLookup.mockReturnValueOnce(
      new Promise(resolve => {
        resolveOld = resolve;
      }),
    );
    const loader = createIdentityUserFilterLookupLoader(service);
    const old = loader.load();
    loader.reset();
    await loader.load();
    resolveOld([{ id: 'old-id', name: 'Old tenant role' }]);
    await old;
    expect(service.getRoleLookup.mock.calls[0]?.[0]?.signal?.aborted).toBe(true);
    expect(loader.state.value).toEqual({
      status: 'ready',
      value: {
        roles: [{ id: 'role-id', label: 'Readers' }],
        organizationUnits: [{ id: 'unit-id', label: 'Development' }],
      },
    });
  });

  it('keeps lookup errors visible and allows a complete retry', async () => {
    const service = api();
    service.getOrganizationUnitLookup.mockRejectedValueOnce(new Error('Lookup unavailable'));
    const loader = createIdentityUserFilterLookupLoader(service);
    await loader.load();
    expect(loader.state.value).toEqual({ status: 'error', message: '' });
    await loader.load();
    expect(loader.state.value.status).toBe('ready');
    expect(service.getRoleLookup).toHaveBeenCalledTimes(2);
  });

  it('does not publish incomplete lookups as empty options', async () => {
    const service = api();
    service.getRoleLookup.mockResolvedValueOnce([{ name: 'Missing identifier' }]);
    const loader = createIdentityUserFilterLookupLoader(service);
    await loader.load();
    expect(loader.state.value).toMatchObject({
      status: 'error',
      message: '',
    });
  });

  it('silences an obsolete rejection after the filter panel is destroyed', async () => {
    const service = api();
    let rejectOld: (reason: unknown) => void = () => {};
    service.getRoleLookup.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectOld = reject;
      }),
    );
    const loader = createIdentityUserFilterLookupLoader(service);
    const pending = loader.load();
    loader.reset();
    rejectOld(new Error('Obsolete failure'));
    await pending;
    expect(loader.state.value).toEqual({ status: 'idle' });
  });
});
