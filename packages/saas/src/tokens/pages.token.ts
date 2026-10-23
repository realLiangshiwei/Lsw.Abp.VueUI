import { defineToken } from '@lsw-abpvue/core';
import type { EditionDto, SaasTenantDto } from '@lsw-abpvue/saas/proxy';
import type { AbpFormGroup, AbpOption, AbpServerValidationError } from '@lsw-abpvue/theme-shared';
import type { ComputedRef } from 'vue';

export type TenantOperation = 'password' | 'invite' | 'impersonate';

/** Commands and current lookup values available to tenant page contributions. */
export interface SaasTenantsPageCommands {
  add(): void;
  edit(tenant: SaasTenantDto): void;
  remove(tenant: SaasTenantDto): void;
  manageFeatures(tenant: SaasTenantDto): void;
  manageConnectionStrings(tenant: SaasTenantDto): void;
  applyDatabaseMigrations(tenant: SaasTenantDto): void;
  viewHistory(tenant: SaasTenantDto): void;
  operate(tenant: SaasTenantDto, operation: TenantOperation): void;
  readonly editionOptions: ComputedRef<readonly AbpOption[]>;
  readonly formValues: ComputedRef<Readonly<Record<string, unknown>>>;
}

/** Commands and current payment plans available to edition page contributions. */
export interface SaasEditionsPageCommands {
  add(): void;
  edit(edition: EditionDto): void;
  remove(edition: EditionDto): void;
  moveAllTenants(edition: EditionDto): void;
  manageFeatures(edition: EditionDto): void;
  viewHistory(edition: EditionDto): void;
  readonly planOptions: ComputedRef<readonly AbpOption[]>;
}

/** Returns localized errors to attach to form members before saving a tenant. */
export type SaasTenantFormValidator = (
  form: AbpFormGroup,
) => readonly AbpServerValidationError[] | null;
export type SaasTenantFormAsyncValidator = (
  form: AbpFormGroup,
) => Promise<readonly AbpServerValidationError[] | null>;

export const SAAS_TENANTS_PAGE = defineToken<SaasTenantsPageCommands>('SAAS_TENANTS_PAGE');
export const SAAS_EDITIONS_PAGE = defineToken<SaasEditionsPageCommands>('SAAS_EDITIONS_PAGE');
export const TENANT_FORM_VALIDATORS_TOKEN = defineToken<readonly SaasTenantFormValidator[]>(
  'TENANT_FORM_VALIDATORS_TOKEN',
);
export const TENANT_FORM_ASYNC_VALIDATORS_TOKEN = defineToken<
  readonly SaasTenantFormAsyncValidator[]
>('TENANT_FORM_ASYNC_VALIDATORS_TOKEN');
