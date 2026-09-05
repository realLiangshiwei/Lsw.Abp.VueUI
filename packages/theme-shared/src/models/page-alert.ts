import type { LocalizationParam } from '@lsw-abpvue/core';
import type { AbpSeverity } from '../contracts/common.js';

/** A message that belongs to a page rather than floating over it, as a toast does. */
export interface PageAlert {
  id: string;
  severity?: AbpSeverity | undefined;
  message: LocalizationParam;
  title?: LocalizationParam | undefined;
  messageLocalizationParams?: string[] | undefined;
  titleLocalizationParams?: string[] | undefined;
  dismissible?: boolean | undefined;
}

/** What `PageAlertService.show()` takes: the id is generated unless the caller owns it. */
export type PageAlertInput = Omit<PageAlert, 'id'> & { id?: string | undefined };
