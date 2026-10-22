import type { ApplicationConfigurationDto, LoginParams } from '@lsw-abpvue/core';
import type { TokenResponse } from '../models/oauth.js';

export interface StoredAuthSession {
  response: TokenResponse;
  customGrant: boolean;
}

/**
 * One way of getting a token. ABP has two, and which one an application uses is a
 * property of its identity server configuration rather than of its code.
 */
export interface AuthFlowStrategy {
  /** The application has its own login form (password) or hands over (authorization code). */
  readonly isInternalAuth: boolean;
  init(): Promise<void>;
  navigateToLogin(
    returnUrl?: string,
    queryParams?: Readonly<Record<string, string>>,
  ): Promise<void>;
  login(params: LoginParams): Promise<void>;
  logout(queryParams?: Record<string, string>): Promise<void>;
  refresh(): Promise<void>;
  /** Drops everything this flow stored, locally. */
  clear(): Promise<void>;
  /** Prepares storage, then returns the synchronous identity commit. */
  prepareSession?(
    response: TokenResponse,
    configuration: ApplicationConfigurationDto,
    customGrant?: boolean,
  ): Promise<() => void>;
  readSession?(): Promise<StoredAuthSession | null>;
}
