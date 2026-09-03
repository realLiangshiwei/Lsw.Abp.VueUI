import { defineService, type InjectionToken } from '../../di/token.js';

export interface WindowService {
  /** `undefined` when there is no browser, which is how callers detect the server. */
  readonly nativeWindow: Window | undefined;
  open(url: string, target?: string, features?: string): void;
}

export const WindowService: InjectionToken<WindowService> = defineService(
  'WindowService',
  (): WindowService => {
    const nativeWindow = typeof window === 'undefined' ? undefined : window;

    return {
      nativeWindow,
      open: (url, target = '_blank', features = 'noopener,noreferrer') => {
        nativeWindow?.open(url, target, features);
      },
    };
  },
);
