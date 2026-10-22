import type { ExtensibleForm, PropData } from '@lsw-abpvue/components';
import { PermissionService, type Injector } from '@lsw-abpvue/core';
import type {
  OrganizationUnitCreateDto,
  OrganizationUnitUpdateDto,
  OrganizationUnitWithDetailsDto,
} from '@lsw-abpvue/identity-pro/proxy';

export class OrganizationUnitStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrganizationUnitStateError';
  }
}

export function organizationUnitDescendantIds(
  units: readonly OrganizationUnitWithDetailsDto[],
  sourceId: string,
): Set<string> {
  const ids = new Set([sourceId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const unit of units) {
      if (unit.id && unit.parentId && ids.has(unit.parentId) && !ids.has(unit.id)) {
        ids.add(unit.id);
        changed = true;
      }
    }
  }
  return ids;
}

export function organizationUnitTargets(
  units: readonly OrganizationUnitWithDetailsDto[],
  sourceId: string,
): OrganizationUnitWithDetailsDto[] {
  const excluded = organizationUnitDescendantIds(units, sourceId);
  return units.filter(unit => unit.id && !excluded.has(unit.id));
}

export function organizationUnitRootIds(
  units: readonly OrganizationUnitWithDetailsDto[],
): Set<string> {
  const rows = new Map(units.flatMap(unit => (unit.id ? [[unit.id, unit] as const] : [])));
  const roots = new Set<string>();
  for (const [id] of rows) {
    const visited: string[] = [];
    let current = id;
    while (true) {
      const cycleStart = visited.indexOf(current);
      if (cycleStart >= 0) {
        const root = visited.slice(cycleStart).sort()[0];
        if (root) roots.add(root);
        break;
      }
      visited.push(current);
      const parentId = rows.get(current)?.parentId;
      if (!parentId || !rows.has(parentId)) {
        roots.add(current);
        break;
      }
      current = parentId;
    }
  }
  return roots;
}

export function organizationUnitPath(
  units: readonly OrganizationUnitWithDetailsDto[],
  id: string,
): string {
  const labels: string[] = [];
  const seen = new Set<string>();
  let current = units.find(unit => unit.id === id);
  while (current?.id && !seen.has(current.id)) {
    seen.add(current.id);
    labels.unshift(current.displayName ?? '');
    current = units.find(unit => unit.id === current?.parentId);
  }
  return labels.join(' / ');
}

export interface OrganizationUnitFormChanges {
  readonly values: Readonly<Record<string, unknown>>;
  readonly writableFields: readonly string[];
  readonly writableExtraProperties: readonly string[];
}

export function getOrganizationUnitFormChanges(
  form: ExtensibleForm<OrganizationUnitWithDetailsDto>,
  record: OrganizationUnitWithDetailsDto | undefined,
  injector: Injector,
): OrganizationUnitFormChanges {
  const permission = injector.get(PermissionService);
  const data: PropData<OrganizationUnitWithDetailsDto> = {
    record: record ?? ({} as OrganizationUnitWithDetailsDto),
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

function serialize(
  changes: OrganizationUnitFormChanges,
  record?: OrganizationUnitWithDetailsDto,
): OrganizationUnitUpdateDto {
  const current = changes.values['displayName'];
  const displayName =
    changes.writableFields.includes('displayName') && current !== undefined
      ? current
      : (record?.displayName ?? '');
  if (typeof displayName !== 'string')
    throw new OrganizationUnitStateError(
      'The display name contributor has an invalid value. Correct the field before saving.',
    );
  const extraProperties = { ...record?.extraProperties };
  const extras = changes.values['extraProperties'];
  if (typeof extras === 'object' && extras !== null && !Array.isArray(extras)) {
    for (const key of changes.writableExtraProperties) {
      const value = (extras as Record<string, unknown>)[key];
      if (Object.hasOwn(extras, key) && value !== undefined) extraProperties[key] = value;
    }
  }
  return { displayName, extraProperties };
}

export function serializeOrganizationUnitCreate(
  changes: OrganizationUnitFormChanges,
  parentId: string | null,
): OrganizationUnitCreateDto {
  return { ...serialize(changes), parentId };
}
export function serializeOrganizationUnitUpdate(
  record: OrganizationUnitWithDetailsDto,
  changes: OrganizationUnitFormChanges,
): OrganizationUnitUpdateDto {
  return { ...serialize(changes, record), concurrencyStamp: record.concurrencyStamp };
}
