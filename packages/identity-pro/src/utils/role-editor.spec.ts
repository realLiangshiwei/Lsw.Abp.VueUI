import {
  FormProp,
  PropType,
  useExtensibleForm,
  EXTENSIONS_IDENTIFIER,
  ExtensionsService,
} from '@lsw-abpvue/components';
import { ConfigStateService, createInjector, type Injector } from '@lsw-abpvue/core';
import type { IdentityRoleDto } from '@lsw-abpvue/identity-pro/proxy';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getIdentityRoleFormChanges,
  IdentityRoleEditorStateError,
  serializeIdentityRoleCreate,
  serializeIdentityRoleUpdate,
  type IdentityRoleFormChanges,
} from './role-editor.js';

const role: IdentityRoleDto = {
  id: 'role',
  name: 'Fresh',
  isDefault: true,
  isPublic: true,
  isStatic: false,
  userCount: 2,
  creationTime: '2026-01-01T00:00:00Z',
  concurrencyStamp: 'fresh',
  extraProperties: { Hidden: 'keep', Editable: 'before' },
};
const injectors: Injector[] = [];
afterEach(() => {
  for (const injector of injectors.splice(0)) injector.destroy();
});
const changes = (
  values: Record<string, unknown>,
  writableFields = Object.keys(values),
  writableExtraProperties: string[] = [],
): IdentityRoleFormChanges => ({ values, writableFields, writableExtraProperties });

describe('commercial role editor serialization', () => {
  it('supplies create defaults and excludes read-only DTO members', () => {
    expect(
      serializeIdentityRoleCreate(
        changes({
          name: 'New',
          id: 'forged',
          isStatic: true,
          userCount: 44,
          creationTime: 'forged',
          concurrencyStamp: 'forged',
        }),
      ),
    ).toEqual({ name: 'New', isDefault: false, isPublic: false, extraProperties: {} });
  });
  it('preserves the fresh detail fields and concurrency stamp when not edited', () => {
    expect(
      serializeIdentityRoleUpdate(
        role,
        changes({ name: 'stale', isDefault: false, isPublic: false }, []),
      ),
    ).toEqual({
      name: 'Fresh',
      isDefault: true,
      isPublic: true,
      concurrencyStamp: 'fresh',
      extraProperties: { Hidden: 'keep', Editable: 'before' },
    });
  });
  it('protects static names even from a contributor that enables the field', () => {
    expect(
      serializeIdentityRoleUpdate(
        { ...role, isStatic: true },
        changes({ name: 'forged', isPublic: false }),
      ),
    ).toMatchObject({ name: 'Fresh', isPublic: false });
  });
  it('merges only permitted extension changes while preserving hidden values', () => {
    expect(
      serializeIdentityRoleUpdate(
        role,
        changes(
          {
            extraProperties: {
              Hidden: 'forged',
              Editable: 'after',
              Added: null,
              Ignored: undefined,
            },
          },
          [],
          ['Editable', 'Added', 'Ignored'],
        ),
      ),
    ).toMatchObject({ extraProperties: { Hidden: 'keep', Editable: 'after', Added: null } });
    expect(role.extraProperties).toEqual({ Hidden: 'keep', Editable: 'before' });
  });
  it.each([
    ['name', 9],
    ['name', null],
    ['isDefault', 'true'],
    ['isPublic', 1],
  ])('rejects an invalid %s contributor value %j', (field, value) => {
    expect(() => serializeIdentityRoleCreate(changes({ [field]: value }))).toThrow(
      IdentityRoleEditorStateError,
    );
  });
  it('keeps explicit false values and ignores undefined overrides', () => {
    expect(
      serializeIdentityRoleUpdate(role, changes({ isDefault: false, isPublic: undefined })),
    ).toMatchObject({ isDefault: false, isPublic: true });
  });
  it('collects only dirty visible writable fields under the current permissions', () => {
    const injector = createInjector([{ provide: EXTENSIONS_IDENTIFIER, useValue: 'role-test' }]);
    injectors.push(injector);
    const config = injector.get(ConfigStateService);
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: { Allowed: true } } });
    const props = FormProp.createMany<IdentityRoleDto>([
      { type: PropType.String, name: 'name' },
      { type: PropType.Boolean, name: 'isDefault', disabled: () => true },
      { type: PropType.Boolean, name: 'isPublic', readonly: () => true },
      { type: PropType.String, name: 'Hidden', isExtra: true, visible: () => false },
      { type: PropType.String, name: 'Denied', isExtra: true, permission: 'Denied' },
      { type: PropType.String, name: 'Editable', isExtra: true, permission: 'Allowed' },
      { type: PropType.String, name: 'Untouched', isExtra: true },
    ]);
    injector
      .get(ExtensionsService)
      .editFormProps.get<IdentityRoleDto>('role-test')
      .addContributor(list => list.addManyTail(props));
    const form = injector.runInContext(() => useExtensibleForm(role));
    for (const prop of props.filter(prop => prop.name !== 'Untouched')) {
      const control = form.form.get(prop.name);
      if (control) control.value = prop.type === PropType.Boolean ? false : 'changed';
      control?.markAsDirty();
    }
    expect(getIdentityRoleFormChanges(form, role, injector)).toMatchObject({
      writableFields: ['name'],
      writableExtraProperties: ['Editable'],
    });
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    expect(getIdentityRoleFormChanges(form, role, injector).writableExtraProperties).toEqual([]);
  });
});
