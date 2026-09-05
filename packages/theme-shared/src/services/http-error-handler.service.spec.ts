import {
  AbpHttpError,
  createInjector,
  defineService,
  HttpErrorReporterService,
  type AbpHttpError as AbpHttpErrorType,
} from '@lsw-abpvue/core';
import { describe, expect, it, vi } from 'vitest';
import { StatusCodeErrorHandler } from '../handlers/status-code-error.handler.js';
import { UnknownStatusCodeErrorHandler } from '../handlers/unknown-status-code-error.handler.js';
import type { AbpErrorHandler } from '../models/error-handler.js';
import { provideErrorHandler } from '../providers/error-handler.provider.js';
import { provideAbpThemeShared } from '../providers/theme-shared.provider.js';
import { ErrorPageService } from './error-page.service.js';
import { HttpErrorHandlerService } from './http-error-handler.service.js';

const failure = (status: number, statusText = '') =>
  new AbpHttpError({ status, statusText, method: 'GET', url: '/api/books' });

const create = () => {
  const injector = createInjector([provideAbpThemeShared()]);
  return {
    injector,
    chain: injector.get(HttpErrorHandlerService),
    errorPage: injector.get(ErrorPageService),
    reporter: injector.get(HttpErrorReporterService),
  };
};

describe('the chain', () => {
  it('runs in priority order and stops at the first handler that takes it', async () => {
    const taken: string[] = [];
    const first = defineService<AbpErrorHandler>('First', () => ({
      priority: 1,
      canHandle: () => true,
      handle: () => void taken.push('first'),
    }));
    const second = defineService<AbpErrorHandler>('Second', () => ({
      priority: 2,
      canHandle: () => true,
      handle: () => void taken.push('second'),
    }));

    const injector = createInjector([provideErrorHandler(second), provideErrorHandler(first)]);
    await injector.get(HttpErrorHandlerService).handle(failure(500));

    expect(taken).toEqual(['first']);
  });

  it('says which handler took it, and says so when none would', async () => {
    const injector = createInjector([]);
    await expect(injector.get(HttpErrorHandlerService).handle(failure(500))).resolves.toBeNull();

    const { chain } = create();
    const handler = await chain.handle(failure(403));
    expect(handler?.priority).toBe(50);
  });

  it('waits for a handler that answers asynchronously', async () => {
    let finished = false;
    const slow = defineService<AbpErrorHandler>('Slow', () => ({
      priority: 1,
      canHandle: () => true,
      handle: async () => {
        await Promise.resolve();
        finished = true;
      },
    }));

    const injector = createInjector([provideErrorHandler(slow)]);
    await injector.get(HttpErrorHandlerService).handle(failure(500));

    expect(finished).toBe(true);
  });

  it('lets an application put its own handler in front of ours', async () => {
    const seen: AbpHttpErrorType[] = [];
    const mine = defineService<AbpErrorHandler>('MineFirst', () => ({
      priority: 5,
      canHandle: error => error.status === 403,
      handle: error => void seen.push(error),
    }));

    const injector = createInjector([provideAbpThemeShared(), provideErrorHandler(mine)]);
    await injector.get(HttpErrorHandlerService).handle(failure(403));

    expect(seen).toHaveLength(1);
    expect(injector.get(ErrorPageService).current.value).toBeNull();
  });
});

describe('the subscription', () => {
  it('gives a reported error to the chain', async () => {
    const { reporter, chain, errorPage } = create();
    chain.init();

    reporter.reportError(failure(404));
    await vi.waitFor(() => expect(errorPage.current.value?.status).toBe(404));
  });

  it('subscribes once however often init is called', async () => {
    let handled = 0;
    const counting = defineService<AbpErrorHandler>('Counting', () => ({
      priority: 1,
      canHandle: () => true,
      handle: () => void (handled += 1),
    }));
    const injector = createInjector([provideErrorHandler(counting)]);
    const chain = injector.get(HttpErrorHandlerService);

    chain.init();
    chain.init();
    injector.get(HttpErrorReporterService).reportError(failure(404));

    await vi.waitFor(() => expect(handled).toBe(1));
  });

  it('stops listening when the injector is destroyed', async () => {
    const { injector, reporter, chain, errorPage } = create();
    chain.init();
    injector.destroy();

    reporter.reportError(failure(404));
    await Promise.resolve();

    expect(errorPage.current.value).toBeNull();
  });

  it('reports a handler that throws instead of losing both problems', async () => {
    const broken = defineService<AbpErrorHandler>('Broken', () => ({
      priority: 1,
      canHandle: () => true,
      handle: () => {
        throw new Error('handler is broken');
      },
    }));
    const injector = createInjector([provideErrorHandler(broken)]);
    const chain = injector.get(HttpErrorHandlerService);
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

    chain.init();
    injector.get(HttpErrorReporterService).reportError(failure(500));

    await vi.waitFor(() => expect(logged).toHaveBeenCalled());
    logged.mockRestore();
  });
});

describe('StatusCodeErrorHandler', () => {
  it('takes the four statuses ABP has words for', () => {
    const handler = createInjector([]).get(StatusCodeErrorHandler);

    expect([401, 403, 404, 500].every(status => handler.canHandle(failure(status)))).toBe(true);
    expect(handler.canHandle(failure(418))).toBe(false);
  });

  it('shows the page with the keys ABP uses for that status', async () => {
    const { chain, errorPage } = create();
    await chain.handle(failure(403));

    expect(errorPage.current.value).toMatchObject({
      status: 403,
      title: { key: 'AbpUi::DefaultErrorMessage403' },
      details: { key: 'AbpUi::DefaultErrorMessage403Detail' },
      showHome: true,
    });
  });
});

describe('UnknownStatusCodeErrorHandler', () => {
  it('takes anything at all, so nothing goes by unseen', () => {
    expect(createInjector([]).get(UnknownStatusCodeErrorHandler).canHandle(failure(418))).toBe(
      true,
    );
  });

  it('falls back to the message that fits any status', async () => {
    const { chain, errorPage } = create();
    await chain.handle(failure(418));

    expect(errorPage.current.value).toMatchObject({
      status: 418,
      title: { key: 'AbpUi::DefaultErrorMessage' },
    });
  });

  it('quotes the transport when the request never landed, and offers no way home', async () => {
    const { chain, errorPage } = create();
    await chain.handle(failure(0));

    expect(errorPage.current.value?.details).toContain('no response');
    expect(errorPage.current.value?.showHome).toBe(false);
  });
});

describe('ErrorPageService', () => {
  it('holds one error at a time and lets it be dismissed', () => {
    const errorPage = createInjector([]).get(ErrorPageService);

    errorPage.show({ status: 500, title: 'AbpUi::500Message' });
    expect(errorPage.current.value?.status).toBe(500);

    errorPage.clear();
    expect(errorPage.current.value).toBeNull();
  });
});
