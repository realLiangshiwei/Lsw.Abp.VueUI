import type {
  ExtensibleEntityDto,
  ExtensibleObject,
  PagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';

export interface ApplicationCreateOrUpdateDtoBase extends ExtensibleObject {
  applicationType: string;
  clientId: string;
  displayName: string;
  clientType?: string | undefined;
  clientSecret?: string | undefined;
  jsonWebKeySet?: string | undefined;
  consentType?: string | undefined;
  extensionGrantTypes?: string[] | undefined;
  postLogoutRedirectUris?: string[] | undefined;
  redirectUris?: string[] | undefined;
  frontChannelLogoutUri?: string | undefined;
  allowPasswordFlow?: boolean | undefined;
  allowClientCredentialsFlow?: boolean | undefined;
  allowAuthorizationCodeFlow?: boolean | undefined;
  allowRefreshTokenFlow?: boolean | undefined;
  allowHybridFlow?: boolean | undefined;
  allowImplicitFlow?: boolean | undefined;
  allowTokenExchangeFlow?: boolean | undefined;
  allowEndSessionEndpoint?: boolean | undefined;
  allowDeviceAuthorizationEndpoint?: boolean | undefined;
  forcePkce?: boolean | undefined;
  allowPushedAuthorizationEndpoint?: boolean | undefined;
  forcePushedAuthorization?: boolean | undefined;
  scopes?: string[] | undefined;
  clientUri?: string | undefined;
  logoUri?: string | undefined;
}

export interface ApplicationDto extends ExtensibleEntityDto<string> {
  applicationType?: string | undefined;
  clientId?: string | undefined;
  displayName?: string | undefined;
  clientType?: string | undefined;
  clientSecret?: string | undefined;
  jsonWebKeySet?: string | undefined;
  consentType?: string | undefined;
  extensionGrantTypes?: string[] | undefined;
  postLogoutRedirectUris?: string[] | undefined;
  redirectUris?: string[] | undefined;
  frontChannelLogoutUri?: string | undefined;
  allowPasswordFlow: boolean;
  allowClientCredentialsFlow: boolean;
  allowAuthorizationCodeFlow: boolean;
  allowRefreshTokenFlow: boolean;
  allowHybridFlow: boolean;
  allowImplicitFlow: boolean;
  allowTokenExchangeFlow: boolean;
  allowEndSessionEndpoint: boolean;
  allowDeviceAuthorizationEndpoint: boolean;
  forcePkce: boolean;
  allowPushedAuthorizationEndpoint: boolean;
  forcePushedAuthorization: boolean;
  scopes?: string[] | undefined;
  clientUri?: string | undefined;
  logoUri?: string | undefined;
}

export interface ApplicationTokenLifetimeDto {
  accessTokenLifetime?: number | null | undefined;
  authorizationCodeLifetime?: number | null | undefined;
  deviceCodeLifetime?: number | null | undefined;
  identityTokenLifetime?: number | null | undefined;
  refreshTokenLifetime?: number | null | undefined;
  userCodeLifetime?: number | null | undefined;
  requestTokenLifetime?: number | null | undefined;
  issuedTokenLifetime?: number | null | undefined;
}

export type CreateApplicationInput = ApplicationCreateOrUpdateDtoBase;

export interface GenerateAccessTokenDto {
  accessToken?: string | undefined;
  tokenType?: string | undefined;
  expiresIn?: number | null | undefined;
  scope?: string | undefined;
}

export interface GenerateAccessTokenInput {
  clientSecret: string;
  scopes?: string[] | undefined;
}

export interface GetApplicationListInput extends PagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

export type UpdateApplicationInput = ApplicationCreateOrUpdateDtoBase;
