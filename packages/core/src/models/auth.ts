import type { AbpHttpError } from './http';

/** What a login form hands to `AuthService.login()`; the password flow's request body. */
export interface LoginParams {
  username: string;
  password: string;
  rememberMe?: boolean | undefined;
  /** Where to go once the configuration has been reloaded. */
  redirectUrl?: string | undefined;
  /** Answers a previous `TwoFactorRequiredError`; sent as ABP's `TwoFactorProvider`. */
  twoFactorProvider?: string | undefined;
  twoFactorCode?: string | undefined;
  /** Redeems one of the codes handed out when two-factor was enabled. */
  recoveryCode?: string | undefined;
}

/**
 * A token endpoint that refused, with the OAuth error body it refused with (RFC 6749
 * §5.2). ABP puts its own fields next to the standard ones, so they are kept as well.
 */
export class AuthError extends Error {
  readonly error: string;
  readonly errorDescription: string | undefined;
  /** Everything else the endpoint answered with, ABP's additions included. */
  readonly params: Record<string, unknown>;

  constructor(error: string, errorDescription?: string, params: Record<string, unknown> = {}) {
    super(errorDescription ? `${error}: ${errorDescription}` : error);
    this.name = 'AuthError';
    this.error = error;
    this.errorDescription = errorDescription;
    this.params = params;
  }
}

/**
 * The credentials were right but the account has a second factor. The login is retried
 * with `twoFactorProvider` and `twoFactorCode` added to the same `LoginParams`.
 */
export class TwoFactorRequiredError extends AuthError {
  readonly userId: string;
  /** Proves the first factor succeeded; a host sends it to have a code delivered. */
  readonly twoFactorToken: string;

  constructor(userId: string, twoFactorToken: string, params: Record<string, unknown> = {}) {
    super('invalid_grant', 'RequiresTwoFactor', params);
    this.name = 'TwoFactorRequiredError';
    this.userId = userId;
    this.twoFactorToken = twoFactorToken;
  }
}

/**
 * One rule about what an authentication failure means. Filters decide whether a failure
 * is the user's session ending -- which clears the tokens and sends them to the login
 * page -- or something the caller is dealing with itself.
 */
export interface AuthErrorFilter {
  id: string;
  /** A filter can be registered switched off and patched on later. */
  executable: boolean;
  /** `true` to leave the session alone. */
  execute(error: AbpHttpError): boolean;
}

/**
 * What happens once a login has produced a token: reload the configuration, remember the
 * choice, go where the user was headed. A token so a host can do it differently.
 */
export type PipeToLoginFn = (
  params: Pick<LoginParams, 'redirectUrl' | 'rememberMe'>,
) => Promise<void>;

/** Runs after the first configuration response, to catch a token the backend disowns. */
export type CheckAuthenticationStateFn = () => void;
