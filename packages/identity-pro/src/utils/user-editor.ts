import type { ExtensibleForm, PropData } from '@lsw-abpvue/components';
import { PermissionService, type Injector, type RestConfig } from '@lsw-abpvue/core';
import type {
  IdentityRoleDto,
  IdentityUserCreateDto,
  IdentityUserDto,
  IdentityUserService,
  IdentityUserUpdateDto,
  OrganizationUnitDto,
  OrganizationUnitWithDetailsDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { computed, shallowRef, type ComputedRef } from 'vue';

export interface IdentityUserEditorPermissions {
  readonly manageRoles: boolean;
  readonly manageOrganizationUnits: boolean;
}

interface IdentityUserEditorSnapshotBase {
  readonly permissions: IdentityUserEditorPermissions;
  readonly assignableRoles: readonly IdentityRoleDto[];
  readonly availableOrganizationUnits: readonly OrganizationUnitWithDetailsDto[];
}

export interface IdentityUserCreateSnapshot extends IdentityUserEditorSnapshotBase {
  readonly mode: 'create';
}

export interface IdentityUserEditSnapshot extends IdentityUserEditorSnapshotBase {
  readonly mode: 'edit';
  readonly user: IdentityUserDto;
  readonly assignedRoles: readonly IdentityRoleDto[];
  readonly assignedOrganizationUnits: readonly OrganizationUnitDto[];
}

export type IdentityUserEditorSnapshot = IdentityUserCreateSnapshot | IdentityUserEditSnapshot;

export interface IdentityUserEditorSelection {
  readonly roleNames?: readonly string[] | undefined;
  readonly organizationUnitIds?: readonly string[] | undefined;
}

export interface IdentityUserFormChanges {
  readonly values: Readonly<Record<string, unknown>>;
  readonly writableFields: readonly string[];
  readonly writableExtraProperties: readonly string[];
}

export type IdentityUserEditorLoadState =
  | { readonly status: 'idle'; readonly revision: number }
  | { readonly status: 'loading'; readonly revision: number; readonly userId?: string | undefined }
  | {
      readonly status: 'ready';
      readonly revision: number;
      readonly snapshot: IdentityUserEditorSnapshot;
    }
  | { readonly status: 'error'; readonly revision: number; readonly error: unknown };

type IdentityUserEditorApi = Pick<
  IdentityUserService,
  | 'get'
  | 'getRoles'
  | 'getOrganizationUnits'
  | 'getAssignableRoles'
  | 'getAvailableOrganizationUnits'
>;

export interface IdentityUserEditorLoader {
  readonly state: ComputedRef<IdentityUserEditorLoadState>;
  load(
    userId: string | undefined,
    permissions: IdentityUserEditorPermissions,
  ): Promise<IdentityUserEditorSnapshot | undefined>;
  reset(): void;
}

export class IdentityUserEditorStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityUserEditorStateError';
  }
}

/**
 * Loads a complete editor session and cancels obsolete lookups before publishing a snapshot.
 * Lookup failures are returned to the caller, which owns their visible error and retry action.
 * @param api The commercial user service
 */
export function createIdentityUserEditorLoader(
  api: IdentityUserEditorApi,
): IdentityUserEditorLoader {
  const state = shallowRef<IdentityUserEditorLoadState>({ status: 'idle', revision: 0 });
  let revision = 0;
  let controller: AbortController | undefined;

  return {
    state: computed(() => state.value),

    async load(userId, permissions) {
      controller?.abort();
      const current = ++revision;
      const request = new AbortController();
      controller = request;
      state.value = { status: 'loading', revision: current, userId };
      const config: RestConfig = { signal: request.signal, skipHandleError: true };

      try {
        const [assignableRoles, availableOrganizationUnits, record] = await Promise.all([
          permissions.manageRoles ? api.getAssignableRoles(config) : Promise.resolve(undefined),
          permissions.manageOrganizationUnits
            ? api.getAvailableOrganizationUnits(config)
            : Promise.resolve(undefined),
          userId === undefined
            ? Promise.resolve(undefined)
            : Promise.all([
                api.get(userId, config),
                api.getRoles(userId, config),
                api.getOrganizationUnits(userId, config),
              ]),
        ]);
        if (request.signal.aborted || current !== revision) return undefined;

        if (
          record &&
          (record[0].id?.toLowerCase() !== userId?.toLowerCase() || !Array.isArray(record[2]))
        ) {
          throw new IdentityUserEditorStateError(
            'The user detail or organization-unit response is incomplete. Reload the editor before saving.',
          );
        }
        const common = {
          permissions: { ...permissions },
          assignableRoles: permissions.manageRoles
            ? requiredItems(assignableRoles, 'assignable roles')
            : [],
          availableOrganizationUnits: permissions.manageOrganizationUnits
            ? requiredItems(availableOrganizationUnits, 'available organization units')
            : [],
        };
        const snapshot: IdentityUserEditorSnapshot = record
          ? {
              ...common,
              mode: 'edit',
              user: { ...record[0], extraProperties: { ...record[0].extraProperties } },
              assignedRoles: requiredItems(record[1], 'assigned roles'),
              assignedOrganizationUnits: [...record[2]],
            }
          : { ...common, mode: 'create' };
        state.value = { status: 'ready', revision: current, snapshot };
        return snapshot;
      } catch (error: unknown) {
        if (request.signal.aborted || current !== revision) return undefined;
        request.abort();
        state.value = { status: 'error', revision: current, error };
        throw error;
      }
    },

    reset() {
      controller?.abort();
      controller = undefined;
      state.value = { status: 'idle', revision: ++revision };
    },
  };
}

function requiredItems<R>(result: { items?: R[] | undefined } | undefined, relation: string): R[] {
  if (Array.isArray(result?.items)) return [...result.items];
  throw new IdentityUserEditorStateError(
    `The ${relation} response is incomplete. Reload the editor before saving.`,
  );
}

/**
 * Collects values the current form permits the user to change, preserving untouched edit fields.
 * @param form The assembled commercial form
 * @param record The current detail, or undefined when creating a user
 * @param injector The editor injector used by property predicates and current permissions
 */
export function getIdentityUserFormChanges(
  form: ExtensibleForm<IdentityUserDto>,
  record: IdentityUserDto | undefined,
  injector: Injector,
): IdentityUserFormChanges {
  const permission = injector.get(PermissionService);
  const data: PropData<IdentityUserDto> = {
    record: record ?? ({} as IdentityUserDto),
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
      (prop.permission !== '' && !permission.isGranted(prop.permission)) ||
      prop.disabled(data) ||
      prop.readonly(data)
    ) {
      continue;
    }
    (prop.isExtra ? writableExtraProperties : writableFields).push(prop.name);
  }

  return { values: form.toRequestBody(), writableFields, writableExtraProperties };
}

export function refreshIdentityUserFormState(
  form: ExtensibleForm<IdentityUserDto>,
  record: IdentityUserDto | undefined,
  injector: Injector,
): void {
  const permission = injector.get(PermissionService);
  const data: PropData<IdentityUserDto> = {
    record: record ?? ({} as IdentityUserDto),
    getInjected: injector.get.bind(injector),
  };
  const phone = form.form.get('phoneNumber')?.value;
  const hasPhone = typeof phone === 'string' && phone.trim() !== '';
  for (const prop of form.props) {
    const control = form.form.get(prop.name);
    if (!control) continue;
    control.disabled =
      !prop.visible(data) ||
      !permission.isGranted(prop.permission) ||
      prop.disabled(data) ||
      (prop.name === 'phoneNumberConfirmed' && !hasPhone);
    control.readonly = prop.readonly(data);
    if (prop.name === 'phoneNumberConfirmed' && !hasPhone && control.value !== false) {
      control.value = false;
    }
  }
}

export function getIdentityUserInitialSelection(snapshot: IdentityUserEditorSnapshot): {
  roleNames: string[];
  organizationUnitIds: string[];
} {
  return {
    roleNames:
      snapshot.mode === 'edit'
        ? namesOf(snapshot.assignedRoles)
        : namesOf(snapshot.assignableRoles.filter(role => role.isDefault)),
    organizationUnitIds: snapshot.mode === 'edit' ? idsOf(snapshot.assignedOrganizationUnits) : [],
  };
}

export function getIdentityUserInheritedRoleIds(
  snapshot: IdentityUserEditorSnapshot,
  selectedOrganizationUnitIds: readonly string[],
): string[] {
  const selected = new Set(selectedOrganizationUnitIds);
  const available = new Map(snapshot.availableOrganizationUnits.map(unit => [unit.id, unit]));
  const roleIds = snapshot.availableOrganizationUnits
    .filter(unit => unit.id !== undefined && selected.has(unit.id))
    .flatMap(unit => unit.roles?.flatMap(role => (role.id === undefined ? [] : [role.id])) ?? []);
  if (snapshot.mode === 'edit') {
    roleIds.push(
      ...snapshot.assignedOrganizationUnits
        .filter(unit => unit.id !== undefined && selected.has(unit.id) && !available.has(unit.id))
        .flatMap(unit => unit.roles?.map(role => role.roleId) ?? []),
    );
  }
  return [...new Set(roleIds)];
}

function namesOf(roles: readonly IdentityRoleDto[]): string[] {
  return roles.map(role => {
    if (role.name !== undefined) return role.name;
    throw new IdentityUserEditorStateError(
      'An assigned role has no name. Reload the editor before saving.',
    );
  });
}

function idsOf(items: readonly { id?: string | undefined }[]): string[] {
  return items.map(item => {
    if (item.id !== undefined) return item.id;
    throw new IdentityUserEditorStateError(
      'An organization unit has no identifier. Reload the editor before saving.',
    );
  });
}

function selectedRelation(
  selected: readonly string[] | undefined,
  available: readonly string[],
  assigned: readonly string[],
): string[] {
  if (selected === undefined) {
    throw new IdentityUserEditorStateError(
      'The relation selection is not loaded. Reopen the editor before saving.',
    );
  }
  const permitted = new Set([...available, ...assigned]);
  if (selected.some(value => !permitted.has(value))) {
    throw new IdentityUserEditorStateError(
      'The relation selection contains an unavailable item. Reload the editor before saving.',
    );
  }
  const editable = new Set(available);
  return [...new Set([...assigned.filter(value => !editable.has(value)), ...selected])];
}

function relationBody(
  snapshot: IdentityUserEditorSnapshot,
  selection: IdentityUserEditorSelection,
): Pick<IdentityUserUpdateDto, 'roleNames' | 'organizationUnitIds'> {
  const assignedRoles = snapshot.mode === 'edit' ? namesOf(snapshot.assignedRoles) : [];
  const assignedUnits = snapshot.mode === 'edit' ? idsOf(snapshot.assignedOrganizationUnits) : [];
  const roleNames = snapshot.permissions.manageRoles
    ? selectedRelation(selection.roleNames, namesOf(snapshot.assignableRoles), assignedRoles)
    : undefined;
  const organizationUnitIds = snapshot.permissions.manageOrganizationUnits
    ? selectedRelation(
        selection.organizationUnitIds,
        idsOf(snapshot.availableOrganizationUnits),
        assignedUnits,
      )
    : undefined;
  return {
    ...(roleNames !== undefined &&
    (snapshot.mode === 'create' || !sameSelection(roleNames, assignedRoles))
      ? { roleNames }
      : {}),
    ...(organizationUnitIds !== undefined &&
    (snapshot.mode === 'create' || !sameSelection(organizationUnitIds, assignedUnits))
      ? { organizationUnitIds }
      : {}),
  };
}

function sameSelection(left: readonly string[], right: readonly string[]): boolean {
  const previous = new Set(right);
  return left.length === previous.size && left.every(value => previous.has(value));
}

function stringValue(
  changes: IdentityUserFormChanges,
  field: string,
  fallback: string | undefined,
): string | undefined {
  if (!changes.writableFields.includes(field) || changes.values[field] === undefined)
    return fallback ?? undefined;
  const value = changes.values[field];
  if (value === null) return '';
  if (typeof value === 'string') return value;
  throw new IdentityUserEditorStateError(
    `The ${field} field is not text. Correct its form contributor before saving.`,
  );
}

function booleanValue(changes: IdentityUserFormChanges, field: string, fallback: boolean): boolean {
  if (!changes.writableFields.includes(field) || changes.values[field] === undefined)
    return fallback;
  const value = changes.values[field];
  if (typeof value === 'boolean') return value;
  throw new IdentityUserEditorStateError(
    `The ${field} field is not a boolean. Correct its form contributor before saving.`,
  );
}

function commonBody(
  changes: IdentityUserFormChanges,
  user?: IdentityUserDto,
): Omit<IdentityUserUpdateDto, 'roleNames' | 'organizationUnitIds' | 'concurrencyStamp'> {
  const phoneNumber = stringValue(changes, 'phoneNumber', user?.phoneNumber);
  const extraProperties: Record<string, unknown> = { ...user?.extraProperties };
  const extraValues = changes.values['extraProperties'];
  if (typeof extraValues === 'object' && extraValues !== null && !Array.isArray(extraValues)) {
    for (const key of changes.writableExtraProperties) {
      if (Object.hasOwn(extraValues, key)) {
        const value = (extraValues as Record<string, unknown>)[key];
        if (value !== undefined) extraProperties[key] = value;
      }
    }
  }

  return {
    userName: stringValue(changes, 'userName', user?.userName) ?? '',
    name: stringValue(changes, 'name', user?.name),
    surname: stringValue(changes, 'surname', user?.surname),
    email: stringValue(changes, 'email', user?.email) ?? '',
    phoneNumber,
    isActive: booleanValue(changes, 'isActive', user?.isActive ?? true),
    lockoutEnabled: booleanValue(changes, 'lockoutEnabled', user?.lockoutEnabled ?? true),
    shouldChangePasswordOnNextLogin: booleanValue(
      changes,
      'shouldChangePasswordOnNextLogin',
      user?.shouldChangePasswordOnNextLogin ?? false,
    ),
    emailConfirmed: booleanValue(changes, 'emailConfirmed', user?.emailConfirmed ?? false),
    phoneNumberConfirmed:
      phoneNumber === undefined || phoneNumber.trim() === ''
        ? false
        : booleanValue(changes, 'phoneNumberConfirmed', user?.phoneNumberConfirmed ?? false),
    extraProperties,
  };
}

/**
 * Serializes only the commercial create contract and explicitly supplies non-nullable defaults.
 * @param snapshot The completely loaded creation session
 * @param changes Values allowed by the current form
 * @param selection Current direct role and organization-unit choices
 */
export function serializeIdentityUserCreate(
  snapshot: IdentityUserCreateSnapshot,
  changes: IdentityUserFormChanges,
  selection: IdentityUserEditorSelection,
): IdentityUserCreateDto {
  return {
    ...commonBody(changes),
    ...relationBody(snapshot, selection),
    password: stringValue(changes, 'password', undefined) ?? '',
    sendConfirmationEmail: booleanValue(changes, 'sendConfirmationEmail', false),
  };
}

/**
 * Serializes a complete update while preserving protected fields, relationships and concurrency.
 * @param snapshot The completely loaded edit session
 * @param changes Values allowed by the current form
 * @param selection Current direct role and organization-unit choices
 */
export function serializeIdentityUserUpdate(
  snapshot: IdentityUserEditSnapshot,
  changes: IdentityUserFormChanges,
  selection: IdentityUserEditorSelection,
): IdentityUserUpdateDto {
  return {
    ...commonBody(changes, snapshot.user),
    ...relationBody(snapshot, selection),
    concurrencyStamp: snapshot.user.concurrencyStamp,
  };
}
