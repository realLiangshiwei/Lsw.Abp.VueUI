import { createInjector } from '@lsw-abpvue/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToasterService } from './toaster.service.js';

const create = () => {
  const injector = createInjector([]);
  return { injector, toaster: injector.get(ToasterService) };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('ToasterService', () => {
  it('keeps what was shown, with the severity of the method that showed it', () => {
    const { toaster } = create();

    toaster.success('AbpUi::Saved');
    toaster.error('AbpUi::Error', 'AbpUi::Oops');

    expect(toaster.toasts.value.map(toast => toast.severity)).toEqual(['success', 'error']);
    expect(toaster.toasts.value[1]?.title).toBe('AbpUi::Oops');
  });

  it('shows a toast for five seconds unless told otherwise', () => {
    const { toaster } = create();
    toaster.info('AbpUi::Hello');

    vi.advanceTimersByTime(4999);
    expect(toaster.toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(toaster.toasts.value).toHaveLength(0);
  });

  it('leaves a sticky toast alone, and reads life 0 the same way', () => {
    const { toaster } = create();
    toaster.info('AbpUi::Sticky', undefined, { sticky: true });
    toaster.info('AbpUi::AlsoSticky', undefined, { life: 0 });

    vi.advanceTimersByTime(60_000);

    expect(toaster.toasts.value).toHaveLength(2);
  });

  it('replaces the toast with the same id instead of stacking a second one', () => {
    const { toaster } = create();

    toaster.info('AbpUi::First', undefined, { id: 'progress' });
    toaster.success('AbpUi::Second', undefined, { id: 'progress' });

    expect(toaster.toasts.value).toHaveLength(1);
    expect(toaster.toasts.value[0]?.message).toBe('AbpUi::Second');
  });

  it('removes a toast by id, and drops the timer with it', () => {
    const { toaster } = create();
    const id = toaster.info('AbpUi::Hello');

    toaster.remove(id);
    expect(toaster.toasts.value).toHaveLength(0);

    // A timer still running would fire against an empty list; the assertion is that
    // advancing time changes nothing.
    vi.advanceTimersByTime(10_000);
    expect(toaster.toasts.value).toHaveLength(0);
  });

  it('clears only the container it was asked about', () => {
    const { toaster } = create();
    toaster.info('AbpUi::InPage');
    toaster.info('AbpUi::InModal', undefined, { containerKey: 'modal' });

    toaster.clear('modal');

    expect(toaster.toasts.value.map(toast => toast.message)).toEqual(['AbpUi::InPage']);
  });

  it('clears everything when no container is named', () => {
    const { toaster } = create();
    toaster.info('AbpUi::InPage');
    toaster.info('AbpUi::InModal', undefined, { containerKey: 'modal' });

    toaster.clear();

    expect(toaster.toasts.value).toHaveLength(0);
  });

  it('is closable unless the caller says otherwise', () => {
    const { toaster } = create();
    toaster.info('AbpUi::Hello');
    toaster.info('AbpUi::Fixed', undefined, { closable: false });

    expect(toaster.toasts.value.map(toast => toast.options.closable)).toEqual([true, false]);
  });

  it('stops its timers when the injector goes away', () => {
    const { injector, toaster } = create();
    toaster.info('AbpUi::Hello');

    injector.destroy();

    expect(vi.getTimerCount()).toBe(0);
  });
});
