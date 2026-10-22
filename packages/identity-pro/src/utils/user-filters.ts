import { AbpHttpError, type RestConfig } from '@lsw-abpvue/core';
import type { GetIdentityUsersInput, IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { computed, shallowRef, type ComputedRef } from 'vue';
import type {
  IdentityUserAdvancedFilters,
  IdentityUserDateFilter,
  IdentityUserDateRange,
} from '../models/user-filters.js';

const textFields = [
  'roleId',
  'organizationUnitId',
  'id',
  'userName',
  'phoneNumber',
  'emailAddress',
  'name',
  'surname',
  'maxCreationTime',
  'minCreationTime',
  'maxModifitionTime',
  'minModifitionTime',
] as const;
const booleanFields = ['isLockedOut', 'notActive', 'emailConfirmed', 'isExternal'] as const;
const datePairs = [
  ['minCreationTime', 'maxCreationTime'],
  ['minModifitionTime', 'maxModifitionTime'],
] as const;

export function createIdentityUserAdvancedFilters(): IdentityUserAdvancedFilters {
  return { notActive: false };
}

export function normalizeIdentityUserAdvancedFilters(
  filters: IdentityUserAdvancedFilters,
): IdentityUserAdvancedFilters {
  const normalized: IdentityUserAdvancedFilters = {};
  for (const field of textFields) {
    const value = filters[field];
    if (typeof value === 'string' && value !== '') normalized[field] = value;
  }
  for (const field of booleanFields) {
    const value = filters[field];
    if (typeof value === 'boolean') normalized[field] = value;
  }
  if (filters.extraProperties) normalized.extraProperties = { ...filters.extraProperties };
  return normalized;
}

export function buildIdentityUserListQuery(
  query: GetIdentityUsersInput,
  filters: IdentityUserAdvancedFilters,
): GetIdentityUsersInput {
  const normalized = normalizeIdentityUserAdvancedFilters(filters);
  const result = { ...query, ...normalized };
  if (query.extraProperties || normalized.extraProperties) {
    result.extraProperties = { ...query.extraProperties, ...normalized.extraProperties };
  }
  return result;
}

export function getIdentityUserDateFilterErrors(
  filters: IdentityUserAdvancedFilters,
): readonly IdentityUserDateFilter[] {
  const invalid: IdentityUserDateFilter[] = [];
  for (const [minimum, maximum] of datePairs) {
    const from = filters[minimum];
    const to = filters[maximum];
    if (from && Number.isNaN(Date.parse(from))) invalid.push(minimum);
    if (to && Number.isNaN(Date.parse(to))) invalid.push(maximum);
    if (from && to && Date.parse(from) > Date.parse(to)) invalid.push(minimum, maximum);
  }
  return invalid;
}

export interface IdentityUserFilterLookup {
  readonly id: string;
  readonly label: string;
}

export function getIdentityUserTodayDateRange(now = new Date()): IdentityUserDateRange {
  const format = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  return {
    from: format(now),
    to: format(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)),
  };
}

export interface IdentityUserFilterLookups {
  readonly roles: readonly IdentityUserFilterLookup[];
  readonly organizationUnits: readonly IdentityUserFilterLookup[];
}

export type IdentityUserFilterLookupState =
  | { readonly status: 'idle' | 'loading' }
  | { readonly status: 'ready'; readonly value: IdentityUserFilterLookups }
  | { readonly status: 'error'; readonly message: string };

export interface IdentityUserFilterLookupLoader {
  readonly state: ComputedRef<IdentityUserFilterLookupState>;
  load(): Promise<void>;
  reset(): void;
}

export class IdentityUserFilterLookupError extends Error {
  constructor() {
    super('The user filter lookup response is incomplete. Refresh the filters to try again.');
    this.name = 'IdentityUserFilterLookupError';
  }
}

export function createIdentityUserFilterLookupLoader(
  api: Pick<IdentityUserService, 'getRoleLookup' | 'getOrganizationUnitLookup'>,
): IdentityUserFilterLookupLoader {
  const state = shallowRef<IdentityUserFilterLookupState>({ status: 'idle' });
  let revision = 0;
  let controller: AbortController | undefined;
  return {
    state: computed(() => state.value),
    async load() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      const current = ++revision;
      state.value = { status: 'loading' };
      const config: RestConfig = { signal: request.signal, skipHandleError: true };
      try {
        const [roles, units] = await Promise.all([
          api.getRoleLookup(config),
          api.getOrganizationUnitLookup(config),
        ]);
        if (request.signal.aborted || current !== revision) return;
        if (!Array.isArray(roles) || !Array.isArray(units)) {
          throw new IdentityUserFilterLookupError();
        }
        state.value = {
          status: 'ready',
          value: {
            roles: roles.map(role => requiredLookup(role.id, role.name)),
            organizationUnits: units.map(unit => requiredLookup(unit.id, unit.displayName)),
          },
        };
      } catch (error: unknown) {
        if (request.signal.aborted || current !== revision) return;
        const message = error instanceof AbpHttpError ? error.error?.message : undefined;
        state.value = {
          status: 'error',
          message: typeof message === 'string' && message.trim() ? message : '',
        };
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

function requiredLookup(
  id: string | undefined,
  label: string | undefined,
): IdentityUserFilterLookup {
  if (!id || typeof label !== 'string') throw new IdentityUserFilterLookupError();
  return { id, label };
}

export function filterIdentityUserLookups(
  values: readonly IdentityUserFilterLookup[],
  term: string,
  selectedId?: string | null,
): readonly IdentityUserFilterLookup[] {
  const search = term.toLocaleLowerCase();
  return values.filter(
    value => value.id === selectedId || value.label.toLocaleLowerCase().includes(search),
  );
}
