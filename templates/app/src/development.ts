import type { Environment } from '@lsw-abpvue/core';

export function developmentEnvironment(environment: Environment, origin: string): Environment {
  const endpoint = (path: string) => new URL(path, origin).href;
  return {
    ...environment,
    apis: { ...environment.apis, default: { ...environment.apis.default, url: '' } },
    oAuthConfig: {
      ...environment.oAuthConfig,
      metadataUrl: endpoint('/.well-known/openid-configuration'),
      metadataSeed: {
        ...environment.oAuthConfig?.metadataSeed,
        token_endpoint: endpoint('/connect/token'),
        revocation_endpoint: endpoint('/connect/revocat'),
        userinfo_endpoint: endpoint('/connect/userinfo'),
        jwks_uri: endpoint('/.well-known/jwks'),
      },
    },
  };
}
