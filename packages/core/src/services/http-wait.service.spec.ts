import { describe, expect, it } from 'vitest';
import { createInjector } from '../di/injector.js';
import { HttpWaitService } from './http-wait.service.js';

const wait = () => createInjector([]).get(HttpWaitService);

describe('HttpWaitService', () => {
  it('nothing is loading to begin with', () => {
    expect(wait().loading.value).toBe(false);
  });

  it('two requests in flight finish only when both are back', () => {
    const service = wait();
    const first = service.start();
    const second = service.start();

    first();
    expect(service.loading.value).toBe(true);

    second();
    expect(service.loading.value).toBe(false);
  });

  it('the same request reporting twice does not push the count below zero', () => {
    const service = wait();
    const done = service.start();
    service.start();

    done();
    done();

    expect(service.loading.value).toBe(true);
  });

  it('clear empties it at once, for an abandoned navigation', () => {
    const service = wait();
    service.start();
    service.start();

    service.clear();

    expect(service.loading.value).toBe(false);
  });
});
