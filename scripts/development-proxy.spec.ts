import { describe, expect, it } from 'vitest';
import { developmentEnvironment } from '../templates/app/src/development.js';

describe('the application development proxy', () => {
  it('keeps API and token requests same-origin while preserving the real issuer', () => {
    const original = {
      apis: {
        default: { url: 'https://api.example.test' },
        reports: { url: 'https://reports.example.test' },
      },
      application: { name: 'BookStore' },
      production: false,
      oAuthConfig: { issuer: 'https://auth.example.test', clientId: 'BookStore_App' },
    };
    const environment = developmentEnvironment(original, 'http://localhost:4200');
    expect(environment.apis.default.url).toBe('');
    expect(environment.oAuthConfig).toMatchObject({
      issuer: 'https://auth.example.test',
      metadataUrl: 'http://localhost:4200/.well-known/openid-configuration',
      metadataSeed: {
        token_endpoint: 'http://localhost:4200/connect/token',
        revocation_endpoint: 'http://localhost:4200/connect/revocat',
      },
    });
    expect(original.apis.default.url).toBe('https://api.example.test');
    expect(environment.apis.reports.url).toBe('https://reports.example.test');
  });
});
