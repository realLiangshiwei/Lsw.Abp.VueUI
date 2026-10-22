import { defineService, type InjectionToken } from '../../di/token.js';

export interface WindowService {
  /** `undefined` when there is no browser, which is how callers detect the server. */
  readonly nativeWindow: Window | undefined;
  open(url: string, target?: string, features?: string): void;
  /**
   * Downloads a blob and releases the temporary browser resources.
   * @param blob The file contents
   * @param fileName The suggested download filename
   */
  downloadBlob(blob: Blob, fileName: string): void;
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
      downloadBlob: (blob, fileName) => {
        if (!nativeWindow) return;
        const url = nativeWindow.URL.createObjectURL(blob);
        const link = nativeWindow.document.createElement('a');
        try {
          link.href = url;
          link.download = fileName;
          link.hidden = true;
          nativeWindow.document.body.append(link);
          link.click();
        } finally {
          link.remove();
          nativeWindow.setTimeout(() => nativeWindow.URL.revokeObjectURL(url), 0);
        }
      },
    };
  },
);
