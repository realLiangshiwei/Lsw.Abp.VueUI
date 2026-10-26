import type {
  ApplicationDto,
  CreateApplicationInput,
  CreateScopeInput,
  ScopeDto,
} from '@lsw-abpvue/openiddict-pro/proxy';
import type { AbpValidator } from '@lsw-abpvue/theme-shared';
import { defaultUriPattern } from '../defaults/uri-pattern.js';

/** Converts an OpenIddict string set to textarea text, or text back to a string set. */
export function hashSetParser(
  value: string | readonly string[] | null | undefined,
): string | string[] | null | undefined {
  if (value == null) return value;
  return typeof value === 'string' ? (value ? value.split(/\r?\n/) : null) : value.join('\n');
}

export function lines(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string'
      ? value.split(/\r\n?|\n/).filter(item => item.trim().length > 0)
      : [];
}

export const allowFlow = (values: Record<string, unknown>): boolean =>
  Boolean(values.allowAuthorizationCodeFlow || values.allowImplicitFlow || values.allowHybridFlow);

/** Validates absolute redirect URIs, including native application schemes. */
export function UrisValidator(): AbpValidator {
  return value =>
    lines(value).every(uri => defaultUriPattern.test(uri))
      ? null
      : {
          rule: 'url',
          key: 'AbpValidation::ThisFieldIsNotAValidFullyQualifiedHttpHttpsOrFtpUrl',
          params: [],
        };
}

export function applicationInput(
  values: Record<string, unknown>,
  record?: ApplicationDto,
): CreateApplicationInput {
  const body: Record<string, unknown> = { ...record, ...values };
  const clientAuthMethod =
    body.clientAuthMethod ?? (record?.jsonWebKeySet?.trim() ? 'jwks' : 'secret');
  delete body.id;
  delete body.clientAuthMethod;
  const confidential = body.clientType === 'confidential';
  return {
    ...body,
    applicationType: String(body.applicationType ?? ''),
    clientId: String(body.clientId ?? ''),
    displayName: String(body.displayName ?? ''),
    clientSecret:
      confidential && clientAuthMethod !== 'jwks' ? String(values.clientSecret ?? '') : '',
    jsonWebKeySet:
      confidential && clientAuthMethod === 'jwks'
        ? String(values.jsonWebKeySet ?? record?.jsonWebKeySet ?? '')
        : '',
    allowClientCredentialsFlow: confidential && body.allowClientCredentialsFlow === true,
    allowPushedAuthorizationEndpoint:
      body.forcePushedAuthorization === true || body.allowPushedAuthorizationEndpoint === true,
    extensionGrantTypes: lines(body.extensionGrantTypes),
    redirectUris: lines(body.redirectUris),
    postLogoutRedirectUris: lines(body.postLogoutRedirectUris),
    scopes: lines(body.scopes),
  };
}

export function scopeInput(values: Record<string, unknown>, record?: ScopeDto): CreateScopeInput {
  return {
    name: String(values.name ?? record?.name ?? ''),
    displayName: String(values.displayName ?? record?.displayName ?? ''),
    description: String(values.description ?? record?.description ?? ''),
    resources: lines(values.resources ?? record?.resources),
    extraProperties: {
      ...record?.extraProperties,
      ...(values.extraProperties as Record<string, unknown> | undefined),
    },
  };
}
