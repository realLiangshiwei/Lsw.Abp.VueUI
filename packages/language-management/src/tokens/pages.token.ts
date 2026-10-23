import { defineToken } from '@lsw-abpvue/core';
import type {
  CultureInfoDto,
  LanguageDto,
  LanguageTextDto,
} from '@lsw-abpvue/language-management/proxy';
import type { ComputedRef } from 'vue';

/** Commands and culture choices available to language page contributions. */
export interface LanguagesPageCommands {
  readonly cultures: ComputedRef<readonly CultureInfoDto[]>;
  add(): Promise<void>;
  edit(record: LanguageDto): Promise<void>;
  remove(record: LanguageDto): Promise<void>;
  setAsDefault(record: LanguageDto): Promise<void>;
}

/** Commands available to translation row and toolbar contributions. */
export interface LanguageTextsPageCommands {
  edit(record: LanguageTextDto): void;
  save(next?: boolean): Promise<void>;
  restore(): Promise<void>;
}

export const LANGUAGES_PAGE = defineToken<LanguagesPageCommands>('LANGUAGES_PAGE');
export const LANGUAGE_TEXTS_PAGE = defineToken<LanguageTextsPageCommands>('LANGUAGE_TEXTS_PAGE');
