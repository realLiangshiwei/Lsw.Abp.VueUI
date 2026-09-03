import { defineToken } from '../di/token.js';
import type { HttpInterceptor } from '../models/http.js';

/**
 * How the transport actually sends a request.
 *
 * It is a token so that a test can hand back a real `Response` for a status nobody can
 * ask a live backend to produce on demand -- 401, 500, a dropped connection -- and so a
 * server renderer can supply its own fetch. Nothing else in `core` calls `fetch`.
 */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const HTTP_FETCH = defineToken<FetchLike>('HTTP_FETCH', {
  factory: () => (input, init) => globalThis.fetch(input, init),
});

/**
 * The interceptor chain, outermost first. Packages contribute with
 * `{ provide: HTTP_INTERCEPTORS, multi: true, useFactory: ... }`.
 */
export const HTTP_INTERCEPTORS = defineToken<HttpInterceptor[]>('HTTP_INTERCEPTORS', {
  multi: true,
});
