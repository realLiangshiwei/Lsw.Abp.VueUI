/** Identifies an application event and the payload accepted by its listeners. */
export interface EventToken<T> {
  readonly key: symbol;
  readonly description: string;
  readonly __type?: T | undefined;
}

export type EventHandler<T> = (payload: T) => void | Promise<void>;

/** Publishes application-local facts without waiting for their consumers. */
export interface EventBus {
  on<T>(event: EventToken<T>, handler: EventHandler<NoInfer<T>>): () => void;
  emit<T>(event: EventToken<T>, payload: NoInfer<T>): void;
}

export class EventHandlerError extends Error {
  constructor(
    readonly eventDescription: string,
    cause: unknown,
  ) {
    super(`A listener for '${eventDescription}' failed. Inspect the cause and fix the listener.`, {
      cause,
    });
    this.name = 'EventHandlerError';
  }
}

export type EventBusErrorHandler = (error: EventHandlerError) => void | Promise<void>;
