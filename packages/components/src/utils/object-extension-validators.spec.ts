import type { ExtensionPropertyAttributeDto, ExtensionPropertyDto } from '@lsw-abpvue/core';
import type { AbpValidator, AbpValidatorContext } from '@lsw-abpvue/theme-shared';
import { describe, expect, it } from 'vitest';
import { getValidatorsFromProperty } from './object-extension-validators.js';

const context: AbpValidatorContext = { valueOf: () => 'other' };

function validatorsOf(...attributes: ExtensionPropertyAttributeDto[]): AbpValidator[] {
  return getValidatorsFromProperty({ attributes } as ExtensionPropertyDto);
}

const failures = (validators: AbpValidator[], value: unknown) =>
  validators.flatMap(validate => validate(value, context) ?? []).map(error => error.rule);

describe('the attributes ABP sends with an extension property', () => {
  it('required refuses an empty value', () => {
    const validators = validatorsOf({
      typeSimple: 'required',
      config: { allowEmptyStrings: false },
    });

    expect(failures(validators, '')).toEqual(['required']);
    expect(failures(validators, 'a')).toEqual([]);
  });

  it('required with allowEmptyStrings contributes nothing, because the server takes one', () => {
    const validators = validatorsOf({
      typeSimple: 'required',
      config: { allowEmptyStrings: true },
    });

    expect(validators).toEqual([]);
  });

  it('stringLength becomes both ends of the range', () => {
    const validators = validatorsOf({
      typeSimple: 'stringLength',
      config: { maximumLength: 4, minimumLength: 2 },
    });

    expect(failures(validators, 'abcde')).toEqual(['maxLength']);
    expect(failures(validators, 'a')).toEqual(['minLength']);
    expect(failures(validators, 'abc')).toEqual([]);
  });

  it('a stringLength with no minimum contributes only the maximum', () => {
    const validators = validatorsOf({
      typeSimple: 'stringLength',
      config: { maximumLength: 4, minimumLength: 0 },
    });

    expect(validators).toHaveLength(1);
    expect(failures(validators, 'a')).toEqual([]);
  });

  it('maxLength and minLength read the length they carry', () => {
    expect(
      failures(validatorsOf({ typeSimple: 'maxLength', config: { length: 2 } }), 'abc'),
    ).toEqual(['maxLength']);
    expect(failures(validatorsOf({ typeSimple: 'minLength', config: { length: 2 } }), 'a')).toEqual(
      ['minLength'],
    );
  });

  it('range covers both bounds', () => {
    const validators = validatorsOf({
      typeSimple: 'range',
      config: { minimum: 0, maximum: 150 },
    });

    expect(failures(validators, 200)).toEqual(['range']);
    expect(failures(validators, 150)).toEqual([]);
  });

  it('regularExpression matches the whole value', () => {
    const validators = validatorsOf({
      typeSimple: 'regularExpression',
      config: { pattern: '^https?://.+' },
    });

    expect(failures(validators, 'not a url')).toEqual(['pattern']);
    expect(failures(validators, 'https://abp.io')).toEqual([]);
  });

  it('emailAddress, url and compare come across as well', () => {
    expect(failures(validatorsOf({ typeSimple: 'emailAddress', config: {} }), 'nope')).toEqual([
      'email',
    ]);
    expect(failures(validatorsOf({ typeSimple: 'url', config: {} }), 'nope')).toEqual(['url']);
    expect(
      failures(validatorsOf({ typeSimple: 'compare', config: { otherProperty: 'password' } }), 'x'),
    ).toEqual(['compare']);
  });

  it('an attribute with no client-side meaning contributes nothing', () => {
    expect(validatorsOf({ typeSimple: 'enumDataType', config: { dataType: 'Custom' } })).toEqual(
      [],
    );
    expect(validatorsOf({ typeSimple: 'display', config: {} })).toEqual([]);
  });

  it('an attribute whose configuration is missing what it needs is skipped', () => {
    expect(validatorsOf({ typeSimple: 'range', config: {} })).toEqual([]);
    expect(validatorsOf({ typeSimple: 'regularExpression', config: {} })).toEqual([]);
    expect(validatorsOf({ typeSimple: 'compare', config: {} })).toEqual([]);
  });

  it('a property with no attributes at all has no validators', () => {
    expect(getValidatorsFromProperty({} as ExtensionPropertyDto)).toEqual([]);
  });
});
