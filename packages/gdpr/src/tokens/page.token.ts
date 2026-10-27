import { defineToken } from '@lsw-abpvue/core';
import type { GdprRequestDto } from '@lsw-abpvue/gdpr/proxy';
import type { ComputedRef } from 'vue';

/** Personal data workflows available to contributed toolbar and cell components. */
export interface GdprPage {
  readonly btnDisabled: ComputedRef<boolean>;
  readonly busy: ComputedRef<string | null>;
  requestPersonalDate(): Promise<void>;
  deleteData(): Promise<void>;
  getUserData(record: GdprRequestDto): Promise<void>;
}

export const GDPR_PAGE = defineToken<GdprPage>('GDPR_PAGE');
