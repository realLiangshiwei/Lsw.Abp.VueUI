import { describe, expect, it } from 'vitest';
import { createInjector } from '../di/injector.js';
import type { Environment } from '../models/environment.js';
import { resolveRootOptions } from '../models/root-options.js';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token.js';
import { EnvironmentService } from './environment.service.js';

const environment: Environment = {
  apis: {
    default: { url: 'https://localhost:44384' },
    Identity: { url: 'https://identity.example.com' },
  },
  application: { name: 'BookStore' },
  production: false,
};

const withEnvironment = (env: Environment) =>
  createInjector([
    { provide: ABP_ROOT_OPTIONS, useValue: resolveRootOptions({ environment: env }) },
  ]);

describe('EnvironmentService', () => {
  it('reads the environment the host gave', () => {
    expect(withEnvironment(environment).get(EnvironmentService).getEnvironment()).toEqual(
      environment,
    );
  });

  it('default is used when no apiName is given', () => {
    expect(withEnvironment(environment).get(EnvironmentService).getApiUrl()).toBe(
      'https://localhost:44384',
    );
  });

  it('an apiName picks that backend', () => {
    expect(withEnvironment(environment).get(EnvironmentService).getApiUrl('Identity')).toBe(
      'https://identity.example.com',
    );
  });

  it('an apiName nobody configured falls back to default', () => {
    expect(withEnvironment(environment).get(EnvironmentService).getApiUrl('Saas')).toBe(
      'https://localhost:44384',
    );
  });

  it('treats a host with no environment as same-origin', () => {
    expect(createInjector([]).get(EnvironmentService).getApiUrl()).toBe('');
  });

  it('the reactive view follows setState', () => {
    const service = withEnvironment(environment).get(EnvironmentService);
    const reactive = service.getEnvironment$();

    service.setState({ ...environment, application: { name: 'Renamed' } });

    expect(reactive.value.application.name).toBe('Renamed');
    expect(service.getEnvironment().application.name).toBe('Renamed');
  });
});
