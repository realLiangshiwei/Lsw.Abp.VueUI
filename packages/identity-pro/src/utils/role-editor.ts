import type { ExtensibleForm, PropData } from '@lsw-abpvue/components';
import { PermissionService, type Injector } from '@lsw-abpvue/core';
import type {
  IdentityRoleCreateDto,
  IdentityRoleDto,
  IdentityRoleUpdateDto,
} from '@lsw-abpvue/identity-pro/proxy';

export interface IdentityRoleFormChanges {
  readonly values: Readonly<Record<string, unknown>>;
  readonly writableFields: readonly string[];
  readonly writableExtraProperties: readonly string[];
}

export class IdentityRoleEditorStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityRoleEditorStateError';
  }
}

/** Collects changes allowed by current contributors and policies. */
export function getIdentityRoleFormChanges(
  form: ExtensibleForm<IdentityRoleDto>,
  record: IdentityRoleDto | undefined,
  injector: Injector,
): IdentityRoleFormChanges {
  const permission = injector.get(PermissionService);
  const data: PropData<IdentityRoleDto> = {
    record: record ?? ({} as IdentityRoleDto),
    getInjected: injector.get.bind(injector),
  };
  const writableFields: string[] = [];
  const writableExtraProperties: string[] = [];
  for (const prop of form.props) {
    const control = form.form.get(prop.name);
    if (
      !control ||
      (form.isEdit && !control.dirty) ||
      control.disabled ||
      control.readonly ||
      !prop.visible(data) ||
      !permission.isGranted(prop.permission) ||
      prop.disabled(data) ||
      prop.readonly(data)
    )
      continue;
    (prop.isExtra ? writableExtraProperties : writableFields).push(prop.name);
  }
  return { values: form.toRequestBody(), writableFields, writableExtraProperties };
}

function value<T extends string | boolean>(
  changes: IdentityRoleFormChanges,
  field: string,
  fallback: T,
): T {
  if (!changes.writableFields.includes(field) || changes.values[field] === undefined)
    return fallback;
  const current = changes.values[field];
  if (typeof current !== typeof fallback)
    throw new IdentityRoleEditorStateError(
      `The ${field} field has an invalid value. Correct its form contributor before saving.`,
    );
  return current as T;
}

function body(changes: IdentityRoleFormChanges, record?: IdentityRoleDto): IdentityRoleCreateDto {
  const extraProperties = { ...record?.extraProperties };
  const extras = changes.values['extraProperties'];
  if (typeof extras === 'object' && extras !== null && !Array.isArray(extras)) {
    for (const key of changes.writableExtraProperties) {
      if (Object.hasOwn(extras, key)) {
        const current = (extras as Record<string, unknown>)[key];
        if (current !== undefined) extraProperties[key] = current;
      }
    }
  }
  return {
    name: record?.isStatic ? (record.name ?? '') : value(changes, 'name', record?.name ?? ''),
    isDefault: value(changes, 'isDefault', record?.isDefault ?? false),
    isPublic: value(changes, 'isPublic', record?.isPublic ?? false),
    extraProperties,
  };
}

/** Serializes the commercial create contract with explicit boolean defaults. */
export function serializeIdentityRoleCreate(
  changes: IdentityRoleFormChanges,
): IdentityRoleCreateDto {
  return body(changes);
}

/** Preserves the fresh concurrency stamp, protected fields and unedited extensions. */
export function serializeIdentityRoleUpdate(
  record: IdentityRoleDto,
  changes: IdentityRoleFormChanges,
): IdentityRoleUpdateDto {
  return { ...body(changes, record), concurrencyStamp: record.concurrencyStamp };
}
