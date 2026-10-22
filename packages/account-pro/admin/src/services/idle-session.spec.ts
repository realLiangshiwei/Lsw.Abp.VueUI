import {
  AuthService,
  ConfigStateService,
  createInjector,
  WindowService,
  type Injector,
} from '@lsw-abpvue/core';
import { computed, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IdleSessionService } from './idle-session.service.js';

const injectors: Injector[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-22T10:00:00Z'));
});
afterEach(() => {
  injectors.splice(0).forEach(injector => injector.destroy());
  vi.useRealTimers();
});
function setup(browser: Window = window) {
  const authenticated = ref(true);
  const logout = vi.fn(() => {
    authenticated.value = false;
    return Promise.resolve();
  });
  const injector = createInjector([
    {
      provide: AuthService,
      useValue: { isAuthenticated: computed(() => authenticated.value), logout },
    },
    { provide: WindowService, useValue: { nativeWindow: browser } },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { ...config.snapshot().currentUser, id: 'member' },
    setting: {
      values: {
        'Abp.Account.Idle.Enabled': 'true',
        'Abp.Account.Idle.IdleTimeoutMinutes': '1',
        'Abp.Account.Idle.CountdownSeconds': '5',
      },
    },
  });
  const service = injector.get(IdleSessionService);
  service.start();
  return { service, logout, config, injector };
}
function crossTab() {
  let receive: ((data: unknown) => void) | undefined;
  class Channel {
    onmessage?: (event: MessageEvent<unknown>) => void;
    constructor() {
      receive = data => this.onmessage?.({ data } as MessageEvent<unknown>);
    }
    postMessage() {}
    close() {}
  }
  return {
    browser: {
      BroadcastChannel: Channel,
      addEventListener: window.addEventListener.bind(window),
      removeEventListener: window.removeEventListener.bind(window),
    } as unknown as Window,
    send: (data: unknown) => receive?.(data),
  };
}
describe('idle account sessions', () => {
  it('warns after inactivity and logs out once after the countdown', async () => {
    const { service, logout } = setup();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(service.visible.value).toBe(true);
    expect(service.countdown.value).toBe(5);
    await vi.advanceTimersByTimeAsync(5000);
    expect(logout).toHaveBeenCalledTimes(1);
  });
  it('keeps the session after an explicit stay-signed-in response', async () => {
    const { service, logout } = setup();
    await vi.advanceTimersByTimeAsync(60_000);
    service.staySignedIn();
    await vi.advanceTimersByTimeAsync(5000);
    expect(service.visible.value).toBe(false);
    expect(logout).not.toHaveBeenCalled();
  });
  it('uses elapsed time when a suspended tab resumes after the entire deadline', async () => {
    const { logout } = setup();
    vi.setSystemTime(new Date('2026-10-22T10:02:00Z'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(logout).toHaveBeenCalledTimes(1);
  });
  it('cleans up activity handlers and timers when the injector is destroyed', async () => {
    const { injector, logout } = setup();
    injector.destroy();
    await vi.advanceTimersByTimeAsync(120_000);
    window.dispatchEvent(new Event('keydown'));
    expect(logout).not.toHaveBeenCalled();
  });
  it('does not extend a suspended session with delayed cross-tab activity', async () => {
    const { browser, send } = crossTab();
    const { logout } = setup(browser);
    const activityTime = Date.now() + 1000;
    vi.setSystemTime(Date.now() + 120_000);
    send({ type: 'activity', subject: ':member', timestamp: activityTime });
    await vi.advanceTimersByTimeAsync(1000);
    expect(logout).toHaveBeenCalledOnce();
  });
  it('accepts a stay response only from the same authenticated subject', async () => {
    const { browser, send } = crossTab();
    const { service, logout } = setup(browser);
    await vi.advanceTimersByTimeAsync(60_000);
    send({ type: 'staySignedIn', subject: ':other', timestamp: Date.now() });
    expect(service.visible.value).toBe(true);
    send({ type: 'staySignedIn', subject: ':member', timestamp: Date.now() });
    expect(service.visible.value).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    expect(logout).not.toHaveBeenCalled();
  });
  it('uses the originating countdown deadline for a delayed warning', async () => {
    const { browser, send } = crossTab();
    const { logout } = setup(browser);
    const warningAt = Date.now() + 60_000;
    vi.setSystemTime(warningAt + 6000);
    send({
      type: 'showModal',
      subject: ':member',
      timestamp: warningAt,
      expiresAt: warningAt + 5000,
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(logout).toHaveBeenCalledOnce();
  });
});
