/** The identity server's metadata did not name an endpoint the flow needs. */
export class OAuthEndpointMissingError extends Error {
  constructor(endpoint: string, issuer: string) {
    super(
      `The OpenID provider at ${issuer || '(no issuer configured)'} did not advertise a ` +
        `"${endpoint}".\n` +
        '  ABP serves its metadata at /.well-known/openid-configuration — check that\n' +
        '  environment.oAuthConfig.issuer points at the identity server and is reachable.',
    );
    this.name = 'OAuthEndpointMissingError';
  }
}
