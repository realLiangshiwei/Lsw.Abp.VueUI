import type { CurrentCultureDto, RestConfig } from '@lsw-abpvue/core';
import type { IdentityUserDto, IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { computed, shallowRef } from 'vue';
import type {
  IdentityUserDetailsLoader,
  IdentityUserDetailsLoadState,
  IdentityUserDetailsOrganizationUnit,
  IdentityUserDetailsSnapshot,
} from '../models/user-details.js';

type IdentityUserDetailsApi = Pick<
  IdentityUserService,
  'get' | 'findById' | 'getOrganizationUnits' | 'getAvailableOrganizationUnits'
>;

export class IdentityUserDetailsStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityUserDetailsStateError';
  }
}

export function createIdentityUserDetailsLoader(
  api: IdentityUserDetailsApi,
): IdentityUserDetailsLoader {
  const state = shallowRef<IdentityUserDetailsLoadState>({ status: 'idle' });
  let revision = 0;
  let controller: AbortController | undefined;

  return {
    state: computed(() => state.value),
    async load(userId) {
      controller?.abort();
      const own = ++revision;
      const request = new AbortController();
      controller = request;
      state.value = { status: 'loading', userId };
      const config: RestConfig = { signal: request.signal, skipHandleError: true };

      try {
        const [user, assigned, available] = await Promise.all([
          api.get(userId, config),
          api.getOrganizationUnits(userId, config),
          api.getAvailableOrganizationUnits(config),
        ]);
        if (request.signal.aborted || own !== revision) return undefined;
        if (
          !user ||
          user.id?.toLowerCase() !== userId.toLowerCase() ||
          !Array.isArray(assigned) ||
          !Array.isArray(available?.items) ||
          !assigned.every(unit => isNonemptyString(unit?.id)) ||
          !available.items.every(unit => isNonemptyString(unit?.id)) ||
          (user.roleNames !== undefined && !Array.isArray(user.roleNames))
        ) {
          throw new IdentityUserDetailsStateError(
            'The user detail or organization-unit response is incomplete. Refresh the details to try again.',
          );
        }

        const ids = [...new Set([user.creatorId, user.lastModifierId].filter(isNonemptyString))];
        const actors = new Map(
          await Promise.all(
            ids.map(async id => {
              const actor: IdentityUserDto | null | undefined = await api.findById(id, config);
              if (actor && actor.id?.toLowerCase() !== id.toLowerCase()) {
                throw new IdentityUserDetailsStateError(
                  'An audit user does not match the requested identity. Refresh the details to try again.',
                );
              }
              return [id, actor ?? undefined] as const;
            }),
          ),
        );
        if (request.signal.aborted || own !== revision) return undefined;
        const snapshot: IdentityUserDetailsSnapshot = {
          user: { ...user, roleNames: [...(user.roleNames ?? [])] },
          creator: user.creatorId ? actors.get(user.creatorId) : undefined,
          modifier: user.lastModifierId ? actors.get(user.lastModifierId) : undefined,
          assignedOrganizationUnits: [...assigned],
          availableOrganizationUnits: [...available.items],
        };
        state.value = { status: 'ready', snapshot };
        return snapshot;
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

function isNonemptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value !== '';
}

export function getIdentityUserDetailsOrganizationUnits(
  snapshot: IdentityUserDetailsSnapshot,
): IdentityUserDetailsOrganizationUnit[] {
  const units = new Map<string, IdentityUserDetailsOrganizationUnit>();
  for (const unit of [
    ...snapshot.availableOrganizationUnits,
    ...snapshot.assignedOrganizationUnits,
  ]) {
    if (!unit.id) continue;
    units.set(unit.id, { id: unit.id, parentId: unit.parentId, displayName: unit.displayName });
  }
  return [...units.values()].map(unit => {
    let parent = unit.parentId;
    const ancestors = new Set([unit.id]);
    while (parent && units.has(parent)) {
      if (ancestors.has(parent)) return { ...unit, parentId: undefined };
      ancestors.add(parent);
      parent = units.get(parent)?.parentId;
    }
    return unit;
  });
}

export function formatIdentityUserDetailsDate(
  value: string | null | undefined,
  culture: CurrentCultureDto,
): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  const locale = culture.cultureName || culture.name || 'en';
  const { shortDatePattern, shortTimePattern, dateSeparator } = culture.dateTimeFormat;
  const pattern =
    shortDatePattern && shortTimePattern ? `${shortDatePattern} ${shortTimePattern}` : undefined;
  if (!pattern)
    return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(date);

  const number = (number: number, digits: number) =>
    new Intl.NumberFormat(locale, { minimumIntegerDigits: digits, useGrouping: false }).format(
      number,
    );
  const named = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, calendar: 'gregory' }).format(date);
  const tokens =
    pattern.match(/'[^']*'|"[^"]*"|\\.|d+|M+|y+|h+|H+|m+|s+|t+|[^dMyhHmst'"\\]+/g) ?? [];
  return tokens
    .map(token => {
      const length = token.length;
      switch (token[0]) {
        case 'd':
          return length >= 3
            ? named({ weekday: length === 3 ? 'short' : 'long' })
            : number(date.getDate(), length);
        case 'M':
          return length >= 3
            ? named({ month: length === 3 ? 'short' : 'long' })
            : number(date.getMonth() + 1, length);
        case 'y':
          return number(
            length === 2 ? date.getFullYear() % 100 : date.getFullYear(),
            Math.min(length, 4),
          );
        case 'h':
          return number(date.getHours() % 12 || 12, length);
        case 'H':
          return number(date.getHours(), length);
        case 'm':
          return number(date.getMinutes(), length);
        case 's':
          return number(date.getSeconds(), length);
        case 't': {
          const period =
            new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true })
              .formatToParts(date)
              .find(part => part.type === 'dayPeriod')?.value ?? '';
          return length === 1 ? period.slice(0, 1) : period;
        }
        default:
          return token[0] === "'" || token[0] === '"'
            ? token.slice(1, -1)
            : token[0] === '\\'
              ? token.slice(1)
              : token.replace(/\//g, dateSeparator ?? '/');
      }
    })
    .join('');
}
