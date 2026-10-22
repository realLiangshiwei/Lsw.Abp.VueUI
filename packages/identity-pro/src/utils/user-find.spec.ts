import type { IdentityUserDto, IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it, vi } from 'vitest';
import type { IdentityUserFindInput } from '../models/user-find.js';
import {
  createIdentityUserFindLoader,
  getIdentityUserFindValidationError,
  IdentityUserFindResponseError,
  normalizeIdentityUserFindInput,
} from './user-find.js';

const USER: IdentityUserDto = {
  id: '12345678-1234-1234-1234-123456789abc',
  userName: 'User+name@example.test',
  email: 'User+tag@example.test',
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

function apiWith() {
  return {
    findById: vi.fn<IdentityUserService['findById']>(() => Promise.resolve(USER)),
    findByUsername: vi.fn<IdentityUserService['findByUsername']>(() => Promise.resolve(USER)),
    findByEmail: vi.fn<IdentityUserService['findByEmail']>(() => Promise.resolve(USER)),
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { resolve, reject, promise };
}

describe('administrative user search input', () => {
  it('trims only user ids and preserves user names and emails exactly', () => {
    expect(normalizeIdentityUserFindInput({ mode: 'id', value: ` ${USER.id} ` })).toEqual({
      mode: 'id',
      value: USER.id,
    });
    for (const mode of ['userName', 'email'] as const)
      expect(normalizeIdentityUserFindInput({ mode, value: ' User+%2F@example.test ' })).toEqual({
        mode,
        value: ' User+%2F@example.test ',
      });
  });

  it.each<readonly [IdentityUserFindInput, string | undefined]>([
    [{ mode: 'id', value: '' }, 'required'],
    [{ mode: 'userName', value: '  ' }, 'required'],
    [{ mode: 'email', value: '\t' }, 'required'],
    [{ mode: 'id', value: 'invalid' }, 'id'],
    [{ mode: 'id', value: ` ${USER.id} ` }, undefined],
    [{ mode: 'userName', value: '.' }, 'path'],
    [{ mode: 'userName', value: '..' }, 'path'],
    [{ mode: 'email', value: '..' }, 'path'],
    [{ mode: 'userName', value: 'user?#&%/+@' }, undefined],
  ])('validates %j without changing service semantics', (input, expected) => {
    expect(getIdentityUserFindValidationError(input)).toBe(expected);
  });
});

describe('administrative user search loader', () => {
  it.each(['id', 'userName', 'email'] as const)(
    'uses only the administrative %s endpoint and accepts case-insensitive matches',
    async mode => {
      const api = apiWith();
      const loader = createIdentityUserFindLoader(api);
      const value = USER[mode]?.toUpperCase() ?? '';
      expect(await loader.find({ mode, value })).toBe(USER);
      const method =
        mode === 'id' ? 'findById' : mode === 'userName' ? 'findByUsername' : 'findByEmail';
      expect(api[method]).toHaveBeenCalledExactlyOnceWith(
        value,
        expect.objectContaining({ signal: expect.any(AbortSignal), skipHandleError: true }),
      );
      expect(Object.values(api).filter(call => call.mock.calls.length)).toHaveLength(1);
      expect(loader.state.value).toEqual({ status: 'found', user: USER });
    },
  );

  it('leaves reserved and already percent-containing text raw for the generated proxy to encode once', async () => {
    const api = apiWith();
    const value = 'User+@?#&/%2F';
    api.findByUsername.mockResolvedValueOnce({ ...USER, userName: value });
    expect((await createIdentityUserFindLoader(api).find({ mode: 'userName', value }))?.id).toBe(
      USER.id,
    );
    expect(api.findByUsername.mock.calls[0]?.[0]).toBe(value);
  });

  it.each([undefined, null])('shows an empty %s response as not found', async user => {
    const api = apiWith();
    api.findByUsername.mockResolvedValueOnce(user as unknown as IdentityUserDto);
    const loader = createIdentityUserFindLoader(api);
    expect(await loader.find({ mode: 'userName', value: 'missing' })).toBeUndefined();
    expect(loader.state.value).toEqual({
      status: 'not-found',
      input: { mode: 'userName', value: 'missing' },
    });
  });

  it.each([
    {},
    { items: [USER], totalCount: 1 },
    { ...USER, id: 'invalid' },
    { ...USER, userName: 'somebody-else' },
  ])('rejects a malformed or mismatched response %j', async response => {
    const api = apiWith();
    api.findByUsername.mockResolvedValueOnce(response as IdentityUserDto);
    const loader = createIdentityUserFindLoader(api);
    await expect(
      loader.find({ mode: 'userName', value: USER.userName ?? '' }),
    ).rejects.toBeInstanceOf(IdentityUserFindResponseError);
    expect(loader.state.value.status).toBe('error');
  });

  it('rejects another id or email even when the returned record has a valid id', async () => {
    const api = apiWith();
    const loader = createIdentityUserFindLoader(api);
    await expect(
      loader.find({ mode: 'id', value: '00000000-0000-0000-0000-000000000001' }),
    ).rejects.toBeInstanceOf(IdentityUserFindResponseError);
    await expect(
      loader.find({ mode: 'email', value: 'another@example.test' }),
    ).rejects.toBeInstanceOf(IdentityUserFindResponseError);
  });

  it('keeps server and transport failures distinct from not-found and supports an explicit retry', async () => {
    const api = apiWith();
    api.findByUsername.mockRejectedValueOnce(new TypeError('Search unavailable'));
    const loader = createIdentityUserFindLoader(api);
    const input = { mode: 'userName', value: USER.userName ?? '' } as const;
    await expect(loader.find(input)).rejects.toThrow('Search unavailable');
    expect(loader.state.value.status).toBe('error');
    expect(await loader.find(input)).toBe(USER);
    expect(loader.state.value.status).toBe('found');
  });

  it('rejects invalid input locally and cancels any prior search', async () => {
    const api = apiWith();
    const pending = deferred<IdentityUserDto>();
    api.findByUsername.mockReturnValueOnce(pending.promise);
    const loader = createIdentityUserFindLoader(api);
    const old = loader.find({ mode: 'userName', value: USER.userName ?? '' });
    await expect(loader.find({ mode: 'id', value: 'invalid' })).rejects.toMatchObject({
      name: 'IdentityUserFindInputError',
      code: 'id',
    });
    expect(api.findByUsername.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(api.findById).not.toHaveBeenCalled();
    pending.resolve(USER);
    expect(await old).toBeUndefined();
    expect(loader.state.value.status).toBe('idle');
  });

  it('discards older late success and failure after another search or reset', async () => {
    const api = apiWith();
    const success = deferred<IdentityUserDto>();
    api.findByUsername.mockReturnValueOnce(success.promise);
    const loader = createIdentityUserFindLoader(api);
    const old = loader.find({ mode: 'userName', value: USER.userName ?? '' });
    await loader.find({ mode: 'email', value: USER.email ?? '' });
    success.resolve(USER);
    expect(await old).toBeUndefined();
    expect(loader.state.value).toEqual({ status: 'found', user: USER });
    const failure = deferred<IdentityUserDto>();
    api.findByUsername.mockReturnValueOnce(failure.promise);
    const closing = loader.find({ mode: 'userName', value: USER.userName ?? '' });
    loader.reset();
    expect(api.findByUsername.mock.calls[1]?.[1]?.signal?.aborted).toBe(true);
    failure.reject(new TypeError('Obsolete failure'));
    expect(await closing).toBeUndefined();
    expect(loader.state.value.status).toBe('idle');
  });
});
