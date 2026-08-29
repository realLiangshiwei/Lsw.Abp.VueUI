import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import {
  AbpHttpError,
  type HttpRequestConfig,
  type HttpResponse,
  type RestConfig,
} from '../models/http';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token';
import { EnvironmentService } from './environment.service';
import { HttpClient } from './http-client.service';
import { HttpErrorReporterService } from './http-error-reporter.service';
import { HttpWaitService } from './http-wait.service';

/** `https://host//api//x` → `https://host/api/x`, leaving the protocol alone. */
function removeDuplicateSlashes(url: string): string {
  return url.replace(/([^:]\/)\/+/g, '$1');
}

/**
 * The service every generated proxy calls. It resolves which backend to talk to, drops
 * the parameters ABP treats as absent, and reports failures so the theme can show them.
 */
export const RestService = defineService('RestService', () => {
  const options = inject(ABP_ROOT_OPTIONS);
  const environment = inject(EnvironmentService);
  const http = inject(HttpClient);
  const errorReporter = inject(HttpErrorReporterService);
  const wait = inject(HttpWaitService);

  /**
   * Angular drops `undefined` and empty strings outright and keeps `null` only when the
   * host asked for it, which is the difference between "not filtering" and "filtering by
   * nothing" in ABP's list endpoints.
   */
  function filterParams(params: HttpRequestConfig['params']): Record<string, unknown> | undefined {
    if (!params) return undefined;

    const kept: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') continue;
      if (value === null && !options.sendNullsAsQueryParam) continue;
      // Angular hands null to HttpParams, which stringifies it; matched on purpose.
      kept[key] = value === null ? 'null' : value;
    }

    return kept;
  }

  async function send<TBody>(
    request: HttpRequestConfig<TBody>,
    config: RestConfig,
  ): Promise<HttpResponse> {
    const base = request.url.startsWith('http') ? '' : environment.getApiUrl(config.apiName);
    const done = wait.start();

    try {
      return await http.request({
        ...request,
        url: removeDuplicateSlashes(base + request.url),
        params: filterParams(request.params),
        context: config,
        ...(config.signal ? { signal: config.signal } : {}),
      });
    } catch (error) {
      if (error instanceof AbpHttpError && !config.skipHandleError)
        errorReporter.reportError(error);
      throw error;
    } finally {
      done();
    }
  }

  return {
    /**
     * @param request What to send; `url` is relative to the resolved API base
     * @param config Which backend, whether to report errors, and what to return
     */
    request: async <TBody, TResult>(
      request: HttpRequestConfig<TBody>,
      config: RestConfig = {},
    ): Promise<TResult> => {
      const response = await send(request, config);
      return (config.observe === 'response' ? response : response.body) as TResult;
    },
  };
});
export type RestService = ServiceOf<typeof RestService>;

export const useRest = (): RestService => inject(RestService);
