/** What a caller asks for, before any interceptor has touched it. */
export interface HttpRequestConfig<TBody = unknown> {
  method: string;
  url: string;
  params?: Record<string, unknown> | undefined;
  body?: TBody | undefined;
  headers?: Record<string, string> | undefined;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | undefined;
  signal?: AbortSignal | undefined;
  /**
   * What `RestService` was asked for, carried along so interceptors can honour
   * `skipAddingHeader` and `skipHandleError`. The transport ignores it.
   */
  context?: RestConfig | undefined;
}

export interface HttpResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Headers;
  body: T;
}

export interface RestConfig {
  /** Which backend of a microservice solution to talk to; `default` when omitted. */
  apiName?: string | undefined;
  /** Keeps the error away from `HttpErrorReporterService`, for a caller that handles it. */
  skipHandleError?: boolean | undefined;
  /** Skips the tenant, language and timezone headers. */
  skipAddingHeader?: boolean | undefined;
  /**
   * Keeps the authentication package out of this request: no bearer token, and no
   * refresh-and-replay on a 401. The token endpoint itself is the reason it exists.
   */
  skipAuthorization?: boolean | undefined;
  /** `response` hands back status and headers instead of just the body. */
  observe?: 'body' | 'response' | undefined;
  /**
   * Cancels the request. Angular cancels by unsubscribing; a promise has nothing to
   * unsubscribe from, so a caller that needs to abort passes a signal.
   */
  signal?: AbortSignal | undefined;
}

/**
 * Wraps the next handler, the way Angular's `HttpInterceptor` does. Interceptors run
 * outermost first and every one of them can rewrite the request, the response, or both.
 */
export type HttpInterceptor = (
  request: HttpRequestConfig,
  next: (request: HttpRequestConfig) => Promise<HttpResponse>,
) => Promise<HttpResponse>;

/** The error envelope ABP's exception middleware returns. */
export interface AbpErrorEnvelope {
  code?: string;
  message?: string;
  details?: string;
  validationErrors?: { message: string; members: string[] }[];
  data?: Record<string, unknown>;
}

export interface AbpHttpErrorInit {
  status: number;
  statusText: string;
  method: string;
  url: string;
  error?: AbpErrorEnvelope | undefined;
  raw?: unknown;
}

/**
 * Every failed request ends up here, whether the server answered with an ABP error
 * envelope, answered with something else, or never answered at all.
 */
export class AbpHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly method: string;
  readonly url: string;
  readonly error: AbpErrorEnvelope | undefined;
  /** The unparsed response body, or the transport failure for a request that never landed. */
  readonly raw: unknown;

  constructor(init: AbpHttpErrorInit) {
    super(
      `${init.method} ${init.url} failed with ${init.status || 'no response'}` +
        (init.error?.message ? `: ${init.error.message}` : ''),
    );
    this.name = 'AbpHttpError';
    this.status = init.status;
    this.statusText = init.statusText;
    this.method = init.method;
    this.url = init.url;
    this.error = init.error;
    this.raw = init.raw;
  }

  /** True when the request never reached the server: offline, DNS, CORS, abort. */
  get isTransportFailure(): boolean {
    return this.status === 0;
  }
}
