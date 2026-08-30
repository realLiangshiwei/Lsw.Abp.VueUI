import type { LoginParams } from '@lsw-abpvue/core';

/**
 * One way of getting a token. ABP has two, and which one an application uses is a
 * property of its identity server configuration rather than of its code.
 */
export interface AuthFlowStrategy {
  /** The application has its own login form (password) or hands over (authorization code). */
  readonly isInternalAuth: boolean;
  init(): Promise<void>;
  navigateToLogin(returnUrl?: string): Promise<void>;
  login(params: LoginParams): Promise<void>;
  logout(queryParams?: Record<string, string>): Promise<void>;
  refresh(): Promise<void>;
  /** Drops everything this flow stored, locally. */
  clear(): Promise<void>;
}
