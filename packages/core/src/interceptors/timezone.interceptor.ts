import { inject } from '../di/inject.js';
import type { HttpInterceptor } from '../models/http.js';
import { ConfigStateService } from '../services/config-state.service.js';

function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // A runtime built without full ICU has no zone to report.
    return undefined;
  }
}

/**
 * Tells a backend that stores UTC which zone to render times in. Only when the clock is
 * configured as UTC: with a local clock the backend already works in the user's zone.
 */
export function timezoneInterceptor(): HttpInterceptor {
  const configState = inject(ConfigStateService);

  return (request, next) => {
    if (request.context?.skipAddingHeader) return next(request);
    if (configState.snapshot().clock.kind !== 'Utc') return next(request);

    const timezone =
      configState.snapshot().setting.values['Abp.Timing.TimeZone'] || browserTimezone();
    if (!timezone) return next(request);

    return next({ ...request, headers: { __timezone: timezone, ...request.headers } });
  };
}
