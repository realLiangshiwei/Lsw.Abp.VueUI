import {
  EXTENSIONS_IDENTIFIER,
  ExtensionsService,
  FormProp,
  PropType,
  useExtensibleForm,
} from '@lsw-abpvue/components';
import { ConfigStateService, createInjector, type Injector } from '@lsw-abpvue/core';
import type { ClaimTypeDto } from '@lsw-abpvue/identity-pro/proxy';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getIdentityClaimTypeFormChanges,
  IdentityClaimTypeEditorStateError,
  serializeIdentityClaimTypeCreate,
  serializeIdentityClaimTypeUpdate,
  type IdentityClaimTypeFormChanges,
} from './claim-type-editor.js';

const record: ClaimTypeDto = {
  id: 'claim',
  name: 'Fresh',
  required: true,
  isStatic: false,
  regex: '^Fresh$',
  regexDescription: 'Fresh expression',
  description: 'Fresh description',
  valueType: 3,
  concurrencyStamp: 'fresh-stamp',
  creationTime: '',
  extraProperties: { Hidden: 'keep', Editable: 'before' },
};
const changes = (
  values: Record<string, unknown>,
  writableFields = Object.keys(values),
  writableExtraProperties: string[] = [],
): IdentityClaimTypeFormChanges => ({ values, writableFields, writableExtraProperties });
const injectors: Injector[] = [];
afterEach(() => {
  for (const injector of injectors.splice(0)) injector.destroy();
});

describe('commercial claim type editor serialization', () => {
  it('whitelists create fields and supplies explicit defaults', () => {
    expect(
      serializeIdentityClaimTypeCreate(
        changes({
          name: 'New',
          id: 'forged',
          isStatic: true,
          creationTime: 'forged',
          concurrencyStamp: 'forged',
          valueTypeAsString: 'forged',
          arbitrary: 'forged',
        }),
      ),
    ).toEqual({
      name: 'New',
      required: false,
      regex: '',
      regexDescription: '',
      description: '',
      valueType: 0,
      extraProperties: {},
    });
  });
  it('preserves every unedited detail value and the fresh concurrency stamp', () => {
    expect(
      serializeIdentityClaimTypeUpdate(
        record,
        changes(
          { name: 'stale', required: false, regex: '', valueType: 0, concurrencyStamp: 'forged' },
          [],
        ),
      ),
    ).toEqual({
      name: 'Fresh',
      required: true,
      regex: '^Fresh$',
      regexDescription: 'Fresh expression',
      description: 'Fresh description',
      valueType: 3,
      concurrencyStamp: 'fresh-stamp',
      extraProperties: { Hidden: 'keep', Editable: 'before' },
    });
  });
  it('retains deliberate false, zero and empty string edits', () => {
    expect(
      serializeIdentityClaimTypeUpdate(
        record,
        changes({
          required: false,
          regex: '',
          regexDescription: '',
          description: '',
          valueType: 0,
        }),
      ),
    ).toMatchObject({
      required: false,
      regex: '',
      regexDescription: '',
      description: '',
      valueType: 0,
    });
  });
  it('preserves hidden extensions and applies only writable changes including null', () => {
    expect(
      serializeIdentityClaimTypeUpdate(
        record,
        changes(
          {
            extraProperties: { Hidden: 'forged', Editable: 'after', New: null, Ignored: undefined },
          },
          [],
          ['Editable', 'New', 'Ignored'],
        ),
      ),
    ).toMatchObject({ extraProperties: { Hidden: 'keep', Editable: 'after', New: null } });
    expect(record.extraProperties?.['Editable']).toBe('before');
  });
  it('rejects static updates before sending any body', () => {
    expect(() =>
      serializeIdentityClaimTypeUpdate({ ...record, isStatic: true }, changes({ name: 'forged' })),
    ).toThrow(IdentityClaimTypeEditorStateError);
  });
  it.each([
    ['name', null],
    ['name', 3],
    ['regex', false],
    ['description', []],
    ['required', 'false'],
    ['valueType', '1'],
    ['valueType', 99],
    ['valueType', Number.NaN],
  ])('rejects an invalid %s contributor value', (name, value) => {
    expect(() => serializeIdentityClaimTypeCreate(changes({ [name]: value }))).toThrow(
      IdentityClaimTypeEditorStateError,
    );
  });
  it('ignores an undefined override instead of erasing the fresh field', () => {
    expect(
      serializeIdentityClaimTypeUpdate(record, changes({ description: undefined })),
    ).toHaveProperty('description', 'Fresh description');
  });
  it('collects only dirty visible authorized writable fields and extensions', () => {
    const injector = createInjector([{ provide: EXTENSIONS_IDENTIFIER, useValue: 'claim-test' }]);
    injectors.push(injector);
    const config = injector.get(ConfigStateService);
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: { Allowed: true } } });
    const props = FormProp.createMany<ClaimTypeDto>([
      { type: PropType.String, name: 'name' },
      { type: PropType.Boolean, name: 'required', disabled: () => true },
      { type: PropType.String, name: 'regex', readonly: () => true },
      { type: PropType.String, name: 'description', visible: () => false },
      { type: PropType.String, name: 'regexDescription', permission: 'Denied' },
      { type: PropType.String, name: 'Hidden', isExtra: true, visible: () => false },
      { type: PropType.String, name: 'Editable', isExtra: true, permission: 'Allowed' },
      { type: PropType.String, name: 'Untouched', isExtra: true },
    ]);
    injector
      .get(ExtensionsService)
      .editFormProps.get<ClaimTypeDto>('claim-test')
      .addContributor(list => list.addManyTail(props));
    const form = injector.runInContext(() => useExtensibleForm(record));
    for (const prop of props.filter(prop => prop.name !== 'Untouched')) {
      const control = form.form.get(prop.name);
      if (control) {
        control.value = prop.name === 'required' ? false : 'changed';
        control.markAsDirty();
      }
    }
    const selected = getIdentityClaimTypeFormChanges(form, record, injector);
    expect(selected.writableFields).toEqual(['name']);
    expect(selected.writableExtraProperties).toEqual(['Editable']);
    expect(serializeIdentityClaimTypeUpdate(record, selected)).toMatchObject({
      name: 'changed',
      required: true,
      regex: '^Fresh$',
      description: 'Fresh description',
      regexDescription: 'Fresh expression',
      extraProperties: { Hidden: 'keep', Editable: 'changed' },
    });
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    expect(getIdentityClaimTypeFormChanges(form, record, injector).writableExtraProperties).toEqual(
      [],
    );
  });
});
