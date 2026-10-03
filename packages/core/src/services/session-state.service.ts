import type { ComputedRef } from 'vue';
import { inject } from '../di/inject.js';
import { defineService, type ServiceOf } from '../di/token.js';
import type { CurrentTenantDto } from '../proxy/models.js';
import { InternalStore } from '../utils/internal-store.js';
import { CookieService } from './platform/cookie.service.js';
import { StorageService } from './platform/storage.service.js';

/** The key ABP's Angular UI uses, so a solution can switch UIs without logging out. */
const SESSION_KEY = 'abpSession';

export interface SessionState {
  language?: string | undefined;
  tenant?: CurrentTenantDto | null | undefined;
  sessionId?: string | undefined;
}

function parse(raw: string | null): SessionState {
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as SessionState) : {};
  } catch {
    // Someone else's key, or a half-written value: starting fresh beats crashing the app.
    return {};
  }
}

/**
 * The part of the session that survives a reload: the chosen language, the tenant and an
 * id for this browser. Kept in local storage and shared between tabs.
 */
export const SessionStateService = defineService('SessionStateService', () => {
  const storage = inject(StorageService);
  const cookies = inject(CookieService);
  const store = new InternalStore<SessionState>({});
  let started = false;

  const persist = () => storage.setItem(SESSION_KEY, JSON.stringify(store.state.value));
  const syncLanguageCookie = (language: string | null): void => {
    if (language) cookies.set('.AspNetCore.Culture', `c=${language}|uic=${language}`);
  };

  return {
    /**
     * Reads the stored session and starts writing changes back. Called by the core app
     * initializer; a factory must not touch storage on its own (SSR constraint S2).
     */
    init: (): void => {
      if (started) return;
      started = true;

      store.set(parse(storage.getItem(SESSION_KEY)));
      syncLanguageCookie(store.state.value.language ?? null);
      store.onUpdate(state => state.language ?? null, syncLanguageCookie);
      store.onUpdate(state => state, persist);
      // Another tab writing the session is the same event as this tab writing it, so the
      // language and tenant of every open tab stay in step.
      storage.onChange(key => {
        if (key === SESSION_KEY || key === null) store.set(parse(storage.getItem(SESSION_KEY)));
      });
    },

    getLanguage: (): string | null => store.state.value.language ?? null,
    getLanguage$: (): ComputedRef<string | null> => store.slice(state => state.language ?? null),
    setLanguage: (language: string): void => store.patch({ language }),
    onLanguageChange: (callback: (language: string | null) => void): (() => void) =>
      store.onUpdate(state => state.language ?? null, callback),

    getTenant: (): CurrentTenantDto | null => store.state.value.tenant ?? null,
    getTenant$: (): ComputedRef<CurrentTenantDto | null> =>
      store.slice(state => state.tenant ?? null),
    setTenant: (tenant: CurrentTenantDto | null): void => store.patch({ tenant }),
    onTenantChange: (callback: (tenant: CurrentTenantDto | null) => void): (() => void) =>
      store.onUpdate(state => state.tenant ?? null, callback),

    /** A stable id for this browser, created on first use. */
    getSessionId: (): string => {
      const existing = store.state.value.sessionId;
      if (existing) return existing;

      const sessionId = crypto.randomUUID();
      store.patch({ sessionId });
      return sessionId;
    },
  };
});
export type SessionStateService = ServiceOf<typeof SessionStateService>;

export const useSessionState = (): SessionStateService => inject(SessionStateService);
