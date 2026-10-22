import type { IdentityUserDto, IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { computed, shallowRef } from 'vue';
import type {
  IdentityUserFindInput,
  IdentityUserFindLoader,
  IdentityUserFindState,
  IdentityUserFindValidationError,
} from '../models/user-find.js';

const guid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export function normalizeIdentityUserFindInput(
  input: IdentityUserFindInput,
): IdentityUserFindInput {
  return { mode: input.mode, value: input.mode === 'id' ? input.value.trim() : input.value };
}

export function getIdentityUserFindValidationError(
  input: IdentityUserFindInput,
): IdentityUserFindValidationError | undefined {
  const { mode, value } = normalizeIdentityUserFindInput(input);
  if (!value.trim()) return 'required';
  if (mode === 'id' && !guid.test(value)) return 'id';
  if (value === '.' || value === '..') return 'path';
  return undefined;
}

export class IdentityUserFindInputError extends Error {
  constructor(readonly code: IdentityUserFindValidationError) {
    super('The user search is invalid. Enter a supported identifier and search again.');
    this.name = 'IdentityUserFindInputError';
  }
}

export class IdentityUserFindResponseError extends Error {
  constructor() {
    super('The user search response does not match the requested identity. Refresh to try again.');
    this.name = 'IdentityUserFindResponseError';
  }
}

export function createIdentityUserFindLoader(
  api: Pick<IdentityUserService, 'findById' | 'findByUsername' | 'findByEmail'>,
): IdentityUserFindLoader {
  const state = shallowRef<IdentityUserFindState>({ status: 'idle' });
  let revision = 0;
  let controller: AbortController | undefined;
  return {
    state: computed(() => state.value),
    async find(input) {
      controller?.abort();
      const own = ++revision;
      const target = normalizeIdentityUserFindInput(input);
      const invalid = getIdentityUserFindValidationError(target);
      if (invalid) {
        state.value = { status: 'idle' };
        throw new IdentityUserFindInputError(invalid);
      }
      const request = new AbortController();
      controller = request;
      state.value = { status: 'loading', input: target };
      const config = { signal: request.signal, skipHandleError: true };
      try {
        const user: IdentityUserDto | null | undefined = await (target.mode === 'id'
          ? api.findById(target.value, config)
          : target.mode === 'userName'
            ? api.findByUsername(target.value, config)
            : api.findByEmail(target.value, config));
        if (request.signal.aborted || own !== revision) return undefined;
        if (user === null || user === undefined) {
          state.value = { status: 'not-found', input: target };
          return undefined;
        }
        const matched = user[target.mode];
        if (
          typeof user.id !== 'string' ||
          !guid.test(user.id) ||
          typeof matched !== 'string' ||
          matched.toUpperCase() !== target.value.toUpperCase()
        )
          throw new IdentityUserFindResponseError();
        state.value = { status: 'found', user };
        return user;
      } catch (error: unknown) {
        if (request.signal.aborted || own !== revision) return undefined;
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
