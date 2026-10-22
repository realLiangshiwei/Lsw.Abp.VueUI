import type { ExtensibleForm, PropData } from '@lsw-abpvue/components';
import { PermissionService, type Injector } from '@lsw-abpvue/core';
import type {
  ClaimTypeDto,
  CreateClaimTypeDto,
  UpdateClaimTypeDto,
} from '@lsw-abpvue/identity-pro/proxy';

export interface IdentityClaimTypeFormChanges {
  readonly values: Readonly<Record<string, unknown>>;
  readonly writableFields: readonly string[];
  readonly writableExtraProperties: readonly string[];
}

export class IdentityClaimTypeEditorStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityClaimTypeEditorStateError';
  }
}

/** Collects changes permitted by current claim type contributors and policies. */
export function getIdentityClaimTypeFormChanges(
  form: ExtensibleForm<ClaimTypeDto>,
  record: ClaimTypeDto | undefined,
  injector: Injector,
): IdentityClaimTypeFormChanges {
  const permission = injector.get(PermissionService);
  const data: PropData<ClaimTypeDto> = {
    record: record ?? ({} as ClaimTypeDto),
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

function field<T extends string | boolean | number>(
  changes: IdentityClaimTypeFormChanges,
  name: string,
  fallback: T,
): T {
  const current = changes.values[name];
  if (!changes.writableFields.includes(name) || current === undefined) return fallback;
  if (
    typeof current !== typeof fallback ||
    (name === 'valueType' && ![0, 1, 2, 3].includes(current as number))
  ) {
    throw new IdentityClaimTypeEditorStateError(
      `The ${name} contributor has an invalid value. Correct the field before saving the claim type.`,
    );
  }
  return current as T;
}

function serialize(
  changes: IdentityClaimTypeFormChanges,
  record?: ClaimTypeDto,
): CreateClaimTypeDto {
  const extraProperties = { ...record?.extraProperties };
  const extras = changes.values['extraProperties'];
  if (typeof extras === 'object' && extras !== null && !Array.isArray(extras)) {
    for (const name of changes.writableExtraProperties) {
      if (!Object.hasOwn(extras, name)) continue;
      const current = (extras as Record<string, unknown>)[name];
      if (current !== undefined) extraProperties[name] = current;
    }
  }
  return {
    name: field(changes, 'name', record?.name ?? ''),
    required: field(changes, 'required', record?.required ?? false),
    regex: field(changes, 'regex', record?.regex ?? ''),
    regexDescription: field(changes, 'regexDescription', record?.regexDescription ?? ''),
    description: field(changes, 'description', record?.description ?? ''),
    valueType: field(changes, 'valueType', record?.valueType ?? 0),
    extraProperties,
  };
}

/** Serializes only the commercial create fields and writable extension values. */
export function serializeIdentityClaimTypeCreate(
  changes: IdentityClaimTypeFormChanges,
): CreateClaimTypeDto {
  return serialize(changes);
}

/** Preserves fresh protected fields, extensions and the concurrency stamp. */
export function serializeIdentityClaimTypeUpdate(
  record: ClaimTypeDto,
  changes: IdentityClaimTypeFormChanges,
): UpdateClaimTypeDto {
  if (record.isStatic)
    throw new IdentityClaimTypeEditorStateError(
      'A static claim type cannot be edited. Reload the claim type list to continue.',
    );
  return { ...serialize(changes, record), concurrencyStamp: record.concurrencyStamp };
}
