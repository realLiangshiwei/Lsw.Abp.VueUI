import { defineToken } from '../di/token.js';
import type { EventBusErrorHandler } from '../models/events.js';

export const EVENT_BUS_ERROR_HANDLER = defineToken<EventBusErrorHandler>(
  'EVENT_BUS_ERROR_HANDLER',
  { factory: () => error => console.error(error) },
);
