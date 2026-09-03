import { inject } from '../di/inject.js';
import type { HttpInterceptor } from '../models/http.js';
import { SessionStateService } from '../services/session-state.service.js';

/** Asks the backend for the language the user picked, so its texts match the UI's. */
export function languageInterceptor(): HttpInterceptor {
  const session = inject(SessionStateService);

  return (request, next) => {
    if (request.context?.skipAddingHeader) return next(request);

    const language = session.getLanguage();
    if (!language) return next(request);

    return next({ ...request, headers: { 'Accept-Language': language, ...request.headers } });
  };
}
