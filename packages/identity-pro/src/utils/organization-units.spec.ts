import {
  EXTENSIONS_IDENTIFIER,
  ExtensionsService,
  FormProp,
  PropType,
  useExtensibleForm,
} from '@lsw-abpvue/components';
import { ConfigStateService, createInjector } from '@lsw-abpvue/core';
import type { OrganizationUnitWithDetailsDto } from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it } from 'vitest';
import {
  getOrganizationUnitFormChanges,
  organizationUnitDescendantIds,
  organizationUnitTargets,
  organizationUnitRootIds,
  organizationUnitPath,
  OrganizationUnitStateError,
  serializeOrganizationUnitCreate,
  serializeOrganizationUnitUpdate,
  type OrganizationUnitFormChanges,
} from './organization-units.js';
const unit: OrganizationUnitWithDetailsDto = {
  id: 'source',
  parentId: 'parent',
  displayName: 'Fresh',
  userCount: 2,
  concurrencyStamp: 'fresh-stamp',
  extraProperties: { Protected: 'keep', Editable: 'before' },
};
const changes = (
  values: Record<string, unknown>,
  writableFields = Object.keys(values),
  writableExtraProperties: string[] = [],
): OrganizationUnitFormChanges => ({ values, writableFields, writableExtraProperties });
describe('organization unit contracts', () => {
  it('disambiguates duplicate unit names by their parent path and terminates on cycles', () => {
    const rows = [
      { id: 'a', displayName: 'A', userCount: 0 },
      { id: 'b', displayName: 'B', userCount: 0 },
      { id: 'one', parentId: 'a', displayName: 'Sales', userCount: 0 },
      { id: 'two', parentId: 'b', displayName: 'Sales', userCount: 0 },
      { id: 'self', parentId: 'self', displayName: 'Cycle', userCount: 0 },
    ];
    expect(organizationUnitPath(rows, 'one')).toBe('A / Sales');
    expect(organizationUnitPath(rows, 'two')).toBe('B / Sales');
    expect(organizationUnitPath(rows, 'self')).toBe('Cycle');
  });

  it('makes orphaned and cyclic rows reachable from a finite root list', () => {
    const rows = [
      { id: 'self', parentId: 'self', userCount: 0 },
      { id: 'two', parentId: 'one', userCount: 0 },
      { id: 'one', parentId: 'two', userCount: 0 },
      { id: 'leaf', parentId: 'two', userCount: 0 },
      { id: 'orphan', parentId: 'missing', userCount: 0 },
    ];
    expect([...organizationUnitRootIds(rows)].sort()).toEqual(['one', 'orphan', 'self']);
  });

  it('excludes the selected subtree from move targets even when codes are missing or misleading', () => {
    const rows = [
      unit,
      { id: 'parent', userCount: 0 },
      { id: 'child', parentId: 'source', code: '99999', userCount: 0 },
      { id: 'grandchild', parentId: 'child', userCount: 0 },
      { id: 'other', code: '', userCount: 0 },
    ];
    expect([...organizationUnitDescendantIds(rows, 'source')].sort()).toEqual([
      'child',
      'grandchild',
      'source',
    ]);
    expect(organizationUnitTargets(rows, 'source').map(row => row.id)).toEqual(['parent', 'other']);
  });
  it('terminates with malformed cyclic parent data and excludes the entire cycle', () => {
    const rows = [
      { id: 'one', parentId: 'two', userCount: 0 },
      { id: 'two', parentId: 'one', userCount: 0 },
    ];
    expect(organizationUnitTargets(rows, 'one')).toEqual([]);
  });
  it('serializes only create contract fields with the explicit trusted parent', () => {
    expect(
      serializeOrganizationUnitCreate(
        changes({
          displayName: 'New',
          parentId: 'forged',
          code: 'forged',
          id: 'forged',
          concurrencyStamp: 'forged',
          roles: ['forged'],
          userCount: 50,
        }),
        'trusted',
      ),
    ).toEqual({ displayName: 'New', parentId: 'trusted', extraProperties: {} });
  });
  it('preserves the fresh name and concurrency stamp for untouched update fields', () => {
    expect(
      serializeOrganizationUnitUpdate(
        unit,
        changes({ displayName: 'Stale', concurrencyStamp: 'forged' }, []),
      ),
    ).toEqual({
      displayName: 'Fresh',
      concurrencyStamp: 'fresh-stamp',
      extraProperties: { Protected: 'keep', Editable: 'before' },
    });
  });
  it('merges only allowed extension changes without mutating the fresh record', () => {
    expect(
      serializeOrganizationUnitUpdate(
        unit,
        changes(
          {
            displayName: 'Changed',
            extraProperties: {
              Protected: 'forged',
              Editable: 'after',
              Added: null,
              Missing: undefined,
            },
          },
          ['displayName'],
          ['Editable', 'Added', 'Missing'],
        ),
      ),
    ).toEqual({
      displayName: 'Changed',
      concurrencyStamp: 'fresh-stamp',
      extraProperties: { Protected: 'keep', Editable: 'after', Added: null },
    });
    expect(unit.extraProperties).toEqual({ Protected: 'keep', Editable: 'before' });
  });
  it.each([false, 10, null, []])(
    'rejects invalid display name contributor value %j',
    displayName => {
      expect(() => serializeOrganizationUnitCreate(changes({ displayName }), null)).toThrow(
        OrganizationUnitStateError,
      );
    },
  );
  it('ignores undefined overrides and serializes a root with null parent', () => {
    expect(serializeOrganizationUnitCreate(changes({ displayName: undefined }), null)).toEqual({
      displayName: '',
      parentId: null,
      extraProperties: {},
    });
  });
  it('collects only dirty visible permitted controls and extra properties', () => {
    const injector = createInjector([{ provide: EXTENSIONS_IDENTIFIER, useValue: 'ou-test' }]);
    const config = injector.get(ConfigStateService);
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: { Allowed: true } } });
    const props = FormProp.createMany<OrganizationUnitWithDetailsDto>([
      { type: PropType.String, name: 'displayName' },
      { type: PropType.String, name: 'code', readonly: () => true },
      { type: PropType.String, name: 'Hidden', isExtra: true, visible: () => false },
      { type: PropType.String, name: 'Denied', isExtra: true, permission: 'Denied' },
      { type: PropType.String, name: 'Disabled', isExtra: true, disabled: () => true },
      { type: PropType.String, name: 'Editable', isExtra: true, permission: 'Allowed' },
      { type: PropType.String, name: 'Untouched', isExtra: true },
    ]);
    injector
      .get(ExtensionsService)
      .editFormProps.get<OrganizationUnitWithDetailsDto>('ou-test')
      .addContributor(list => list.addManyTail(props));
    const form = injector.runInContext(() => useExtensibleForm(unit));
    for (const prop of props.filter(prop => prop.name !== 'Untouched')) {
      const control = form.form.get(prop.name);
      if (control) {
        control.value = 'changed';
        control.markAsDirty();
      }
    }
    expect(getOrganizationUnitFormChanges(form, unit, injector)).toMatchObject({
      writableFields: ['displayName'],
      writableExtraProperties: ['Editable'],
    });
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    expect(getOrganizationUnitFormChanges(form, unit, injector).writableExtraProperties).toEqual(
      [],
    );
    injector.destroy();
  });
});
