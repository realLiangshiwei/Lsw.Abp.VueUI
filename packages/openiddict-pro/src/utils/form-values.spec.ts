import { describe, expect, it } from 'vitest';
import {
  applicationInput,
  hashSetParser,
  lines,
  scopeInput,
  UrisValidator,
} from './form-values.js';

describe('OpenIddict form values', () => {
  it('exposes the string-set conversion used by form contributors', () => {
    expect(hashSetParser(['one', 'two'])).toBe('one\ntwo');
    expect(hashSetParser('one\r\ntwo')).toEqual(['one', 'two']);
    expect(hashSetParser('')).toBeNull();
    expect(hashSetParser(undefined)).toBeUndefined();
    expect(hashSetParser(null)).toBeNull();
  });
  it.each([
    'https://example.test/callback?code=1',
    'com.example:/callback',
    'urn:example:callback',
    'http://127.0.0.1:4200/',
    'file://example.test:123/path',
    'com.example:',
  ])('accepts the absolute URI %s', uri => {
    expect(UrisValidator()(uri, { valueOf: () => undefined })).toBeNull();
  });
  it.each([
    '/relative',
    'https://example.test/invalid path',
    'https://example.test/%qq',
    'not-a-uri',
    'https://example.test/{bad}',
    'https://example.test/[bad]',
    'https://example.test\\path',
    'https://\u00e9xample.test/callback',
  ])('rejects the invalid URI %s', uri => {
    expect(UrisValidator()(uri, { valueOf: () => undefined })).not.toBeNull();
  });
  it('accepts empty optional URIs and splits all line endings', () => {
    expect(UrisValidator()('', { valueOf: () => undefined })).toBeNull();
    expect(lines('one\r\ntwo\rthree\n\n')).toEqual(['one', 'two', 'three']);
    expect(scopeInput({ name: 'example', resources: '' }).resources).toEqual([]);
  });
  it('clears both authentication methods for public applications and forces PAR when required', () => {
    expect(
      applicationInput({
        applicationType: 'web',
        clientId: 'public',
        displayName: 'Public',
        clientType: 'public',
        clientSecret: 'unused',
        jsonWebKeySet: 'unused',
        clientAuthMethod: 'jwks',
        forcePushedAuthorization: true,
      }),
    ).toMatchObject({
      clientSecret: '',
      jsonWebKeySet: '',
      allowClientCredentialsFlow: false,
      allowPushedAuthorizationEndpoint: true,
    });
  });
});
