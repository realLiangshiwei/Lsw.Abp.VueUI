import type { ExtensibleForm, PropData } from '@lsw-abpvue/components';
import { PermissionService, type Injector } from '@lsw-abpvue/core';
import type {
  EditionCreateDto,
  EditionDto,
  EditionUpdateDto,
  SaasTenantCreateDto,
  SaasTenantDto,
  SaasTenantUpdateDto,
} from '@lsw-abpvue/saas/proxy';

export function collectSaasFormValues<
  R extends { extraProperties?: Record<string, unknown> | undefined },
>(form: ExtensibleForm<R>, record: R | undefined, injector: Injector): Record<string, unknown> {
  const values: Record<string, unknown> = {
    ...record,
    extraProperties: { ...record?.extraProperties },
  };
  const extras = values['extraProperties'] as Record<string, unknown>;
  const data: PropData<R> = {
    record: record ?? ({} as R),
    getInjected: injector.get.bind(injector),
  };
  const permission = injector.get(PermissionService);
  for (const prop of form.props) {
    const control = form.form.get(prop.name);
    if (
      !control ||
      (form.isEdit && !control.dirty) ||
      control.disabled ||
      control.readonly ||
      prop.disabled(data) ||
      prop.readonly(data) ||
      !prop.visible(data) ||
      !permission.isGranted(prop.permission)
    )
      continue;
    if (control.value !== undefined) (prop.isExtra ? extras : values)[prop.name] = control.value;
  }
  return values;
}

export function tenantCreate(values: Record<string, unknown>): SaasTenantCreateDto {
  return {
    name: String(values['name'] ?? ''),
    adminEmailAddress: String(values['adminEmailAddress'] ?? ''),
    adminPassword: String(values['adminPassword'] ?? ''),
    editionId: (values['editionId'] || null) as SaasTenantCreateDto['editionId'],
    activationState: (values['activationState'] ?? 0) as SaasTenantDto['activationState'],
    activationEndDate: (values['activationEndDate'] ||
      null) as SaasTenantCreateDto['activationEndDate'],
    editionEndDateUtc: (values['editionEndDateUtc'] ||
      null) as SaasTenantCreateDto['editionEndDateUtc'],
    extraProperties: values['extraProperties'] as SaasTenantCreateDto['extraProperties'],
  };
}

export function tenantUpdate(values: Record<string, unknown>): SaasTenantUpdateDto {
  const { name, editionId, activationState, activationEndDate, extraProperties } =
    tenantCreate(values);
  return {
    name,
    editionId,
    activationState,
    activationEndDate,
    extraProperties,
    editionEndDateUtc: values['editionEndDateUtc'] as SaasTenantDto['editionEndDateUtc'],
    concurrencyStamp: values['concurrencyStamp'] as SaasTenantDto['concurrencyStamp'],
  };
}

export function editionCreate(values: Record<string, unknown>): EditionCreateDto {
  return {
    displayName: String(values['displayName'] ?? ''),
    planId: (values['planId'] || null) as EditionDto['planId'],
    extraProperties: values['extraProperties'] as EditionDto['extraProperties'],
  };
}

export function editionUpdate(values: Record<string, unknown>): EditionUpdateDto {
  return {
    ...editionCreate(values),
    concurrencyStamp: values['concurrencyStamp'] as EditionDto['concurrencyStamp'],
  };
}
