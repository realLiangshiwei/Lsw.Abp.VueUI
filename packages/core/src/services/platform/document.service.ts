import { defineService, type InjectionToken } from '../../di/token.js';

export interface DocumentService {
  /** `undefined` when there is no browser, which is how callers detect the server. */
  readonly nativeDocument: Document | undefined;
  setTitle(title: string): void;
  setDir(dir: 'ltr' | 'rtl'): void;
  getBaseUrl(): string;
}

export const DocumentService: InjectionToken<DocumentService> = defineService(
  'DocumentService',
  (): DocumentService => {
    const nativeDocument = typeof document === 'undefined' ? undefined : document;

    return {
      nativeDocument,
      setTitle: title => {
        if (nativeDocument) nativeDocument.title = title;
      },
      setDir: dir => {
        nativeDocument?.documentElement.setAttribute('dir', dir);
      },
      getBaseUrl: () => nativeDocument?.querySelector('base')?.getAttribute('href') ?? '/',
    };
  },
);
