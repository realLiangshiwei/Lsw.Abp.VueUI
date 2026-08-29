import { defineService, type InjectionToken } from '../../di/token';

export interface CookieOptions {
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
}

export interface CookieService {
  get(key: string): string | undefined;
  set(key: string, value: string, options?: CookieOptions): void;
  remove(key: string, options?: Pick<CookieOptions, 'path' | 'domain'>): void;
}

function serialize(key: string, value: string, options: CookieOptions): string {
  const parts = [`${encodeURIComponent(key)}=${encodeURIComponent(value)}`];

  if (options.expires) parts.push(`expires=${options.expires.toUTCString()}`);
  parts.push(`path=${options.path ?? '/'}`);
  if (options.domain) parts.push(`domain=${options.domain}`);
  if (options.sameSite) parts.push(`samesite=${options.sameSite}`);
  if (options.secure) parts.push('secure');

  return parts.join('; ');
}

export const CookieService: InjectionToken<CookieService> = defineService(
  'CookieService',
  (): CookieService => {
    const nativeDocument = typeof document === 'undefined' ? undefined : document;

    return {
      get: key => {
        const wanted = encodeURIComponent(key);

        for (const entry of nativeDocument?.cookie.split(';') ?? []) {
          const separator = entry.indexOf('=');
          if (separator < 0) continue;
          if (entry.slice(0, separator).trim() !== wanted) continue;

          return decodeURIComponent(entry.slice(separator + 1));
        }

        return undefined;
      },
      set: (key, value, options = {}) => {
        if (nativeDocument) nativeDocument.cookie = serialize(key, value, options);
      },
      remove: (key, options = {}) => {
        if (nativeDocument) {
          nativeDocument.cookie = serialize(key, '', { ...options, expires: new Date(0) });
        }
      },
    };
  },
);
