import { describe, expect, it } from 'vitest';
import { createInjector } from '../di/injector';
import { AbpHttpError } from '../models/http';
import { AuthErrorFilterService } from './auth-error-filter.service';

const unauthorized = (url = '/api/identity/users') =>
  new AbpHttpError({ status: 401, statusText: 'Unauthorized', method: 'GET', url });

const service = () => createInjector([]).get(AuthErrorFilterService);

describe('authentication error filters', () => {
  it('with no filter nothing is claimed and the session is treated as over', () => {
    expect(service().run(unauthorized())).toBe(false);
  });

  it('a filter claiming the failure keeps the session', () => {
    const filters = service();
    filters.add({ id: 'polling', executable: true, execute: error => error.url.includes('poll') });

    expect(filters.run(unauthorized('/api/poll'))).toBe(true);
    expect(filters.run(unauthorized('/api/identity/users'))).toBe(false);
  });

  it('a filter that is switched off takes no part', () => {
    const filters = service();
    filters.add({ id: 'polling', executable: false, execute: () => true });

    expect(filters.run(unauthorized())).toBe(false);
  });

  it('patch changes only the fields it was given', () => {
    const filters = service();
    filters.add({ id: 'polling', executable: false, execute: () => true });

    filters.patch({ id: 'polling', executable: true });

    expect(filters.get('polling')?.execute(unauthorized())).toBe(true);
    expect(filters.run(unauthorized())).toBe(true);
  });

  it('patching an id that is not there does nothing', () => {
    const filters = service();

    filters.patch({ id: 'nobody', executable: true });

    expect(filters.get('nobody')).toBeUndefined();
  });

  it('a removed filter no longer takes part', () => {
    const filters = service();
    filters.add({ id: 'polling', executable: true, execute: () => true });

    filters.remove('polling');

    expect(filters.run(unauthorized())).toBe(false);
  });
});
