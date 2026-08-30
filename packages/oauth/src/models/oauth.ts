/** What a token endpoint answers with when it agrees (RFC 6749 §5.1). */
export interface TokenResponse {
  access_token: string;
  token_type?: string | undefined;
  expires_in?: number | undefined;
  refresh_token?: string | undefined;
  scope?: string | undefined;
  id_token?: string | undefined;
}

/** The tokens as the application holds them, whichever flow produced them. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string | undefined;
  /** Epoch milliseconds. `Infinity` when the endpoint did not say when it lapses. */
  expiresAt: number;
}

/** The parts of an OpenID provider's metadata this package uses. */
export interface DiscoveryDocument {
  token_endpoint?: string | undefined;
  revocation_endpoint?: string | undefined;
  end_session_endpoint?: string | undefined;
}
