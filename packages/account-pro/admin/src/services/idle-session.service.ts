import {
  AuthService,
  ConfigStateService,
  defineService,
  inject,
  onServiceDestroy,
  StorageService,
  WindowService,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { computed, ref, watch } from 'vue';

export const IdleSessionService = defineService('IdleSessionService', () => {
  const auth = inject(AuthService);
  const config = inject(ConfigStateService);
  const storage = inject(StorageService);
  const browser = inject(WindowService).nativeWindow as
    (Window & { BroadcastChannel?: typeof BroadcastChannel }) | undefined;
  const visible = ref(false);
  const countdown = ref(0);
  const failed = ref(false);
  const busy = ref(false);
  let timer: ReturnType<typeof setInterval> | undefined;
  let channel: BroadcastChannel | undefined;
  let lastActivity = Date.now();
  let expiresAt = 0;
  let started = false;
  const enabled = computed(
    () =>
      auth.isAuthenticated.value &&
      (
        storage.getItem('isIdleSessionEnabled') ??
        config.snapshot().setting.values['Abp.Account.Idle.Enabled']
      )?.toLowerCase() === 'true',
  );
  const timeout = computed(
    () =>
      Math.max(
        0,
        Number(config.snapshot().setting.values['Abp.Account.Idle.IdleTimeoutMinutes']) || 0,
      ) * 60_000,
  );
  const seconds = computed(() =>
    Math.max(
      1,
      Number(config.snapshot().setting.values['Abp.Account.Idle.CountdownSeconds']) || 60,
    ),
  );
  function subject(): string {
    return `${config.snapshot().currentTenant.id ?? ''}:${config.snapshot().currentUser.id ?? ''}`;
  }
  function broadcast(type: 'activity' | 'staySignedIn' | 'showModal'): void {
    channel?.postMessage({ type, subject: subject(), timestamp: Date.now(), expiresAt });
  }
  function reset(): void {
    lastActivity = Date.now();
    expiresAt = 0;
    visible.value = false;
    countdown.value = 0;
    failed.value = false;
  }
  function activity(): void {
    if (!enabled.value || visible.value) return;
    const now = Date.now();
    if (now - lastActivity < 1000) return;
    lastActivity = now;
    broadcast('activity');
  }
  async function logout(): Promise<void> {
    if (busy.value) return;
    busy.value = true;
    failed.value = false;
    try {
      await auth.logout();
      reset();
    } catch {
      failed.value = true;
    } finally {
      busy.value = false;
    }
  }
  function tick(): void {
    if (!enabled.value || !timeout.value) {
      if (visible.value) reset();
      return;
    }
    const now = Date.now();
    if (!visible.value && now >= lastActivity + timeout.value) {
      expiresAt = lastActivity + timeout.value + seconds.value * 1000;
      visible.value = true;
      broadcast('showModal');
    }
    if (visible.value) {
      countdown.value = Math.max(0, Math.ceil((expiresAt - now) / 1000));
      if (!countdown.value && !failed.value) void logout();
    }
  }
  function stop(): void {
    if (timer) clearInterval(timer);
    timer = undefined;
    browser?.removeEventListener('pointermove', activity);
    browser?.removeEventListener('pointerdown', activity);
    browser?.removeEventListener('keydown', activity);
    channel?.close();
    channel = undefined;
    started = false;
    reset();
  }
  function start(): void {
    if (started || !browser) return;
    started = true;
    reset();
    browser.addEventListener('pointermove', activity, { passive: true });
    browser.addEventListener('pointerdown', activity, { passive: true });
    browser.addEventListener('keydown', activity);
    if (browser.BroadcastChannel) {
      channel = new browser.BroadcastChannel('idle-session-activity');
      channel.onmessage = (event: MessageEvent<unknown>) => {
        const data = event.data;
        if (
          !enabled.value ||
          !data ||
          typeof data !== 'object' ||
          !('subject' in data) ||
          data.subject !== subject() ||
          !('type' in data) ||
          !('timestamp' in data) ||
          typeof data.timestamp !== 'number' ||
          !Number.isFinite(data.timestamp) ||
          data.timestamp < lastActivity ||
          data.timestamp > Date.now()
        )
          return;
        if (data.type === 'staySignedIn') reset();
        if (data.type === 'staySignedIn' || (data.type === 'activity' && !visible.value))
          lastActivity = data.timestamp;
        if (data.type === 'showModal' && !visible.value) {
          expiresAt =
            'expiresAt' in data &&
            typeof data.expiresAt === 'number' &&
            Number.isFinite(data.expiresAt)
              ? data.expiresAt
              : data.timestamp + seconds.value * 1000;
          visible.value = true;
          tick();
        }
      };
    }
    timer = setInterval(tick, 1000);
  }
  onServiceDestroy(
    watch(
      [
        enabled,
        timeout,
        seconds,
        () => config.snapshot().currentUser.id,
        () => config.snapshot().currentTenant.id,
      ],
      reset,
    ),
  );
  onServiceDestroy(stop);
  return {
    visible: computed(() => visible.value),
    countdown: computed(() => countdown.value),
    failed: computed(() => failed.value),
    busy: computed(() => busy.value),
    start,
    stop,
    logout,
    staySignedIn(): void {
      reset();
      broadcast('staySignedIn');
    },
  };
});
export type IdleSessionService = ServiceOf<typeof IdleSessionService>;
