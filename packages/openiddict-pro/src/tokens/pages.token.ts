import { defineToken } from '@lsw-abpvue/core';
import type { ApplicationDto, ScopeDto } from '@lsw-abpvue/openiddict-pro/proxy';
import type { ComputedRef } from 'vue';

/** Commands available to OpenIddict row and toolbar contributions. */
export interface OpenIddictPageCommands<R> {
  add(): Promise<void>;
  edit(record: R): Promise<void>;
  remove(record: R): Promise<void>;
}

/** Application commands and reactive choices available to form contributions. */
export interface ApplicationsPageCommands extends OpenIddictPageCommands<ApplicationDto> {
  readonly values: ComputedRef<Record<string, unknown>>;
  readonly scopes: ComputedRef<readonly ScopeDto[]>;
  permissions(record: ApplicationDto): void;
  tokenLifetime(record: ApplicationDto): void;
  generateAccessToken(record: ApplicationDto): void;
}

export const APPLICATIONS_PAGE = defineToken<ApplicationsPageCommands>('APPLICATIONS_PAGE');
export const SCOPES_PAGE = defineToken<OpenIddictPageCommands<ScopeDto>>('SCOPES_PAGE');
