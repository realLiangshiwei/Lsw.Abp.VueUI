import type { CurrentCultureDto } from '@lsw-abpvue/core';
import type { IdentityUserDto, IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it, vi } from 'vitest';
import type { IdentityUserDetailsSnapshot } from '../models/user-details.js';
import {
  createIdentityUserDetailsLoader,
  formatIdentityUserDetailsDate,
  getIdentityUserDetailsOrganizationUnits,
  IdentityUserDetailsStateError,
} from './user-details.js';

const USER: IdentityUserDto = {
  id: 'user-a',
  userName: 'sample',
  emailConfirmed: false,
  phoneNumberConfirmed: false,
  supportTwoFactor: false,
  twoFactorEnabled: false,
  isActive: true,
  lockoutEnabled: true,
  isLockedOut: false,
  shouldChangePasswordOnNextLogin: false,
  accessFailedCount: 0,
  isExternal: false,
};

function apiWith(user = USER) {
  return {
    get: vi.fn<IdentityUserService['get']>(() => Promise.resolve(user)),
    findById: vi.fn<IdentityUserService['findById']>(id => Promise.resolve({ ...USER, id })),
    getOrganizationUnits: vi.fn<IdentityUserService['getOrganizationUnits']>(() =>
      Promise.resolve([]),
    ),
    getAvailableOrganizationUnits: vi.fn<IdentityUserService['getAvailableOrganizationUnits']>(() =>
      Promise.resolve({ items: [] }),
    ),
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { resolve, reject, promise };
}

describe('commercial user details loader', () => {
  it('loads fresh user and both organization relations without requesting absent audit users', async () => {
    const api = apiWith();
    const loader = createIdentityUserDetailsLoader(api);
    const result = await loader.load('user-a');
    expect(result?.user).toEqual({ ...USER, roleNames: [] });
    expect(api.get).toHaveBeenCalledOnce();
    expect(api.getOrganizationUnits).toHaveBeenCalledOnce();
    expect(api.getAvailableOrganizationUnits).toHaveBeenCalledOnce();
    expect(api.findById).not.toHaveBeenCalled();
    expect(loader.state.value.status).toBe('ready');
  });

  it('resolves creator and modifier through the administrative lookup and deduplicates equal ids', async () => {
    const api = apiWith({ ...USER, creatorId: 'audit', lastModifierId: 'audit' });
    const result = await createIdentityUserDetailsLoader(api).load('user-a');
    expect(api.findById).toHaveBeenCalledExactlyOnceWith(
      'audit',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        skipHandleError: true,
      }),
    );
    expect(result?.creator?.id).toBe('audit');
    expect(result?.modifier).toBe(result?.creator);
  });

  it('treats an empty 204 audit lookup as a missing user without hiding other audit failures', async () => {
    const api = apiWith({ ...USER, creatorId: 'missing' });
    api.findById.mockResolvedValueOnce(undefined as unknown as IdentityUserDto);
    const loader = createIdentityUserDetailsLoader(api);
    expect((await loader.load('user-a'))?.creator).toBeUndefined();
    api.findById.mockRejectedValueOnce(new TypeError('Audit connection failed'));
    await expect(loader.load('user-a')).rejects.toThrow('Audit connection failed');
    expect(loader.state.value.status).toBe('error');
    expect((await loader.load('user-a'))?.creator?.id).toBe('missing');
  });

  it('rejects a mismatched audit record instead of displaying another user name', async () => {
    const api = apiWith({ ...USER, lastModifierId: 'expected' });
    api.findById.mockResolvedValueOnce({ ...USER, id: 'another' });
    await expect(createIdentityUserDetailsLoader(api).load('user-a')).rejects.toBeInstanceOf(
      IdentityUserDetailsStateError,
    );
  });

  it.each(['detail', 'assigned', 'available'] as const)(
    'keeps an incomplete %s response as an explicit failure',
    async relation => {
      const api = apiWith();
      if (relation === 'detail') api.get.mockResolvedValueOnce({ ...USER, id: 'wrong' });
      if (relation === 'assigned')
        api.getOrganizationUnits.mockResolvedValueOnce(undefined as never);
      if (relation === 'available')
        api.getAvailableOrganizationUnits.mockResolvedValueOnce({} as never);
      const loader = createIdentityUserDetailsLoader(api);
      await expect(loader.load('user-a')).rejects.toBeInstanceOf(IdentityUserDetailsStateError);
      expect(loader.state.value.status).toBe('error');
    },
  );

  it('cancels older sessions and ignores their late success or failure', async () => {
    const api = apiWith();
    const old = deferred<IdentityUserDto>();
    api.get.mockReturnValueOnce(old.promise);
    const loader = createIdentityUserDetailsLoader(api);
    const first = loader.load('user-a');
    const firstSignal = api.get.mock.calls[0]?.[1]?.signal;
    api.get.mockResolvedValueOnce({ ...USER, id: 'user-b' });
    const current = await loader.load('user-b');
    expect(firstSignal?.aborted).toBe(true);
    old.resolve(USER);
    expect(await first).toBeUndefined();
    expect(loader.state.value).toEqual({ status: 'ready', snapshot: current });

    const rejected = deferred<IdentityUserDto>();
    api.get.mockReturnValueOnce(rejected.promise);
    const pending = loader.load('user-a');
    loader.reset();
    rejected.reject(new TypeError('Obsolete failure'));
    expect(await pending).toBeUndefined();
    expect(loader.state.value.status).toBe('idle');
  });

  it('aborts audit lookups on close and publishes no late data', async () => {
    const api = apiWith({ ...USER, creatorId: 'audit' });
    const actor = deferred<IdentityUserDto>();
    api.findById.mockReturnValueOnce(actor.promise);
    const loader = createIdentityUserDetailsLoader(api);
    const pending = loader.load('user-a');
    await vi.waitFor(() => expect(api.findById).toHaveBeenCalledOnce());
    loader.reset();
    expect(api.findById.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    actor.resolve({ ...USER, id: 'audit' });
    expect(await pending).toBeUndefined();
    expect(loader.state.value.status).toBe('idle');
  });
});

describe('commercial user detail organization units', () => {
  it('retains unavailable assigned units and makes cyclic data renderable without mutating the snapshot', () => {
    const snapshot: IdentityUserDetailsSnapshot = {
      user: USER,
      creator: undefined,
      modifier: undefined,
      assignedOrganizationUnits: [
        { id: 'child', parentId: 'root', displayName: 'Child' },
        { id: 'unavailable', parentId: 'missing', displayName: 'Restricted' },
      ],
      availableOrganizationUnits: [
        { id: 'root', displayName: 'Root', userCount: 1 },
        { id: 'child', parentId: 'root', userCount: 0 },
        { id: 'cycle-a', parentId: 'cycle-b', userCount: 0 },
        { id: 'cycle-b', parentId: 'cycle-a', userCount: 0 },
      ],
    };
    const units = getIdentityUserDetailsOrganizationUnits(snapshot);
    expect(units).toHaveLength(5);
    expect(units.find(unit => unit.id === 'child')?.displayName).toBe('Child');
    expect(units.find(unit => unit.id === 'unavailable')?.parentId).toBe('missing');
    expect(units.find(unit => unit.id === 'cycle-a')?.parentId).toBeUndefined();
    expect(snapshot.availableOrganizationUnits[2]?.parentId).toBe('cycle-b');
  });
});

describe('commercial user detail dates', () => {
  const culture = (pattern: string, time: string, name = 'en-US'): CurrentCultureDto => ({
    cultureName: name,
    isRightToLeft: false,
    dateTimeFormat: { shortDatePattern: pattern, shortTimePattern: time, dateSeparator: '-' },
  });
  const date = new Date(2030, 0, 2, 13, 4, 5).toISOString();

  it('uses the configured date order, separator, hour cycle and seconds in local time', () => {
    expect(formatIdentityUserDetailsDate(date, culture('dd/MM/yyyy', 'HH:mm:ss'))).toBe(
      '02-01-2030 13:04:05',
    );
    expect(formatIdentityUserDetailsDate(date, culture('M/d/yy', 'h:mm tt'))).toBe(
      '1-2-30 1:04 PM',
    );
    expect(
      formatIdentityUserDetailsDate(date, culture("yyyy'年'M'月'd'日'", 'HH:mm', 'zh-CN')),
    ).toBe('2030年1月2日 13:04');
  });

  it('keeps quoted separators and localized month names', () => {
    expect(formatIdentityUserDetailsDate(date, culture("dd'/'MMM'/'yyyy", 'H:mm'))).toBe(
      '02/Jan/2030 13:04',
    );
  });

  it('returns no display value for empty or invalid dates and falls back to culture formatting when patterns are absent', () => {
    expect(formatIdentityUserDetailsDate(null, culture('yyyy', 'HH'))).toBeUndefined();
    expect(formatIdentityUserDetailsDate('invalid', culture('yyyy', 'HH'))).toBeUndefined();
    expect(
      formatIdentityUserDetailsDate(date, {
        cultureName: 'en-US',
        isRightToLeft: false,
        dateTimeFormat: {},
      }),
    ).toBeTruthy();
  });
});
