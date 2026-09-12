import { ApiDefinitionError } from './api-definition/source.js';
import { UnknownModuleError } from './generator/generate.js';

/**
 * Something the person running the command can fix. The message is printed on its own,
 * without a stack trace: a stack from a code generator says nothing a user can act on.
 */
export class CliError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'CliError';
  }
}

/** Whether the failure is one the message alone explains. */
export function isUserFacingError(error: unknown): error is Error {
  return (
    error instanceof CliError ||
    error instanceof ApiDefinitionError ||
    error instanceof UnknownModuleError
  );
}
