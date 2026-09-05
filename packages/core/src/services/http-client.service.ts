import { isPlainObject } from '@lsw-abpvue/utils';
import { getCurrentInjector, inject } from '../di/inject.js';
import { defineService, type ServiceOf } from '../di/token.js';
import {
  AbpHttpError,
  type AbpErrorEnvelope,
  type HttpRequestConfig,
  type HttpResponse,
} from '../models/http.js';
import { HTTP_FETCH, HTTP_INTERCEPTORS } from '../tokens/http.token.js';

type Handler = (request: HttpRequestConfig) => Promise<HttpResponse>;

function withParams(url: string, params: HttpRequestConfig['params']): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined) continue;

    for (const item of Array.isArray(value) ? value : [value]) {
      if (item === undefined) continue;
      search.append(key, item instanceof Date ? item.toISOString() : String(item));
    }
  }

  const query = search.toString();
  if (!query) return url;

  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  return Object.keys(headers).some(key => key.toLowerCase() === name);
}

function buildInit(request: HttpRequestConfig): RequestInit {
  const headers: Record<string, string> = { ...request.headers };
  const init: RequestInit = { method: request.method.toUpperCase() };

  if (request.body !== undefined && request.body !== null) {
    if (isPlainObject(request.body) || Array.isArray(request.body)) {
      init.body = JSON.stringify(request.body);
      if (!hasHeader(headers, 'content-type')) headers['Content-Type'] = 'application/json';
    } else {
      init.body = request.body as BodyInit;
    }
  }

  // ABP answers a binary endpoint with an octet stream, and asking for it keeps a
  // content-negotiating backend from sending JSON instead.
  const binary = request.responseType === 'blob' || request.responseType === 'arraybuffer';
  if (binary && !hasHeader(headers, 'accept')) headers.Accept = 'application/octet-stream';

  init.headers = headers;
  if (request.signal) init.signal = request.signal;

  return init;
}

/**
 * Pulls the ABP envelope out of an error body. The response may well be a blob or plain
 * text, so the body is read as text and parsed here rather than trusted to be JSON.
 */
function parseEnvelope(text: string): AbpErrorEnvelope | undefined {
  if (!text) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return undefined;
  }

  if (!isPlainObject(parsed)) return undefined;
  const envelope = isPlainObject(parsed.error) ? parsed.error : parsed;

  const looksLikeOne =
    typeof envelope.code === 'string' ||
    typeof envelope.message === 'string' ||
    Array.isArray(envelope.validationErrors);

  return looksLikeOne ? (envelope as AbpErrorEnvelope) : undefined;
}

async function readBody(response: Response, responseType: HttpRequestConfig['responseType']) {
  switch (responseType) {
    case 'text':
      return response.text();
    case 'blob':
      return response.blob();
    case 'arraybuffer':
      return response.arrayBuffer();
    default: {
      const text = await response.text();
      // 204 and other empty answers are normal for commands, and JSON.parse('') throws.
      return text ? (JSON.parse(text) as unknown) : undefined;
    }
  }
}

export const HttpClient = defineService('HttpClient', () => {
  const send = inject(HTTP_FETCH);
  const injector = getCurrentInjector();
  let chain: Handler | null = null;

  const transport: Handler = async request => {
    const url = withParams(request.url, request.params);
    const method = request.method.toUpperCase();
    let response: Response;

    try {
      response = await send(url, buildInit(request));
    } catch (cause) {
      // Offline, DNS, CORS and abort all land here, with no status to report.
      throw new AbpHttpError({ status: 0, statusText: '', method, url, raw: cause });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new AbpHttpError({
        status: response.status,
        statusText: response.statusText,
        method,
        url,
        error: parseEnvelope(text),
        headers: response.headers,
        raw: text,
      });
    }

    let body: unknown;
    try {
      body = await readBody(response, request.responseType);
    } catch (cause) {
      throw new AbpHttpError({
        status: response.status,
        statusText: response.statusText,
        method,
        url,
        error: { message: 'The response body could not be read as JSON.' },
        headers: response.headers,
        raw: cause,
      });
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body,
    };
  };

  /**
   * Built on the first request rather than while this service is: an interceptor that
   * needs the configuration, the session or an access token would otherwise ask for a
   * service that is itself still waiting for this one.
   *
   * Outermost first, so the order providers are registered in is the order a request
   * passes through them and the reverse of the order a response comes back.
   */
  function chainOf(): Handler {
    const interceptors = injector?.get(HTTP_INTERCEPTORS, [], { optional: true }) ?? [];

    return interceptors.reduceRight<Handler>(
      (next, interceptor) => request => interceptor(request, next),
      transport,
    );
  }

  return {
    request: <T>(request: HttpRequestConfig): Promise<HttpResponse<T>> => {
      chain ??= chainOf();
      return chain(request) as Promise<HttpResponse<T>>;
    },
  };
});
export type HttpClient = ServiceOf<typeof HttpClient>;
