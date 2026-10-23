import type { EventToken } from '../models/events.js';

/**
 * Defines an event identity independently of its diagnostic name.
 * @param description Name included when reporting listener failures
 */
/*#__NO_SIDE_EFFECTS__*/
export function defineEvent<T>(description: string): EventToken<T> {
  return { key: Symbol(description), description };
}
