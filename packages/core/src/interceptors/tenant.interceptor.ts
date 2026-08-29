import { inject } from '../di/inject';
import type { HttpInterceptor } from '../models/http';
import { SessionStateService } from '../services/session-state.service';
import { TENANT_KEY } from '../tokens/tenant-key.token';

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
