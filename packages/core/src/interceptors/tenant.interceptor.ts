import { inject } from '../di/inject.js';
import type { HttpInterceptor } from '../models/http.js';
import { SessionStateService } from '../services/session-state.service.js';
import { TENANT_KEY } from '../tokens/tenant-key.token.js';

/** Tells the backend which tenant the user is acting in. */
export function tenantInterceptor(): HttpInterceptor {
  const session = inject(SessionStateService);
  const tenantKey = inject(TENANT_KEY);

  return (request, next) => {
    if (request.context?.skipAddingHeader) return next(request);

    const tenantId = session.getTenant()?.id;
    if (!tenantId) return next(request);

    return next({ ...request, headers: { [tenantKey]: tenantId, ...request.headers } });
  };
}
