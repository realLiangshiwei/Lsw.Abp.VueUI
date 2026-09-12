import { describe, expect, it } from 'vitest';
import { namedTypes, parseClrType, typePoolKey } from './clr-type.js';

describe('parseClrType', () => {
  it('reads a plain name', () => {
    expect(parseClrType('System.String')).toEqual({
      kind: 'name',
      name: 'System.String',
      args: [],
    });
  });

  it('drops nullability, which the property states separately', () => {
    expect(parseClrType('System.Guid?')).toEqual({ kind: 'name', name: 'System.Guid', args: [] });
  });

  it('reads a collection', () => {
    expect(parseClrType('[System.String]')).toEqual({
      kind: 'array',
      item: { kind: 'name', name: 'System.String', args: [] },
    });
  });

  it('reads a dictionary', () => {
    expect(parseClrType('{string:boolean}')).toEqual({
      kind: 'dictionary',
      key: { kind: 'name', name: 'string', args: [] },
      value: { kind: 'name', name: 'boolean', args: [] },
    });
  });

  it('reads a dictionary of collections', () => {
    expect(parseClrType('{string:[Volo.Abp.NameValue]}')).toEqual({
      kind: 'dictionary',
      key: { kind: 'name', name: 'string', args: [] },
      value: { kind: 'array', item: { kind: 'name', name: 'Volo.Abp.NameValue', args: [] } },
    });
  });

  it('reads generic arguments', () => {
    expect(
      parseClrType('Volo.Abp.Application.Dtos.PagedResultDto<Volo.Abp.Identity.IdentityUserDto>'),
    ).toEqual({
      kind: 'name',
      name: 'Volo.Abp.Application.Dtos.PagedResultDto',
      args: [{ kind: 'name', name: 'Volo.Abp.Identity.IdentityUserDto', args: [] }],
    });
  });

  it('reads nested generics with more than one argument', () => {
    const parsed = parseClrType('A.B<C.D<E>,System.Collections.Generic.Dictionary<string,string>>');

    expect(parsed).toMatchObject({ name: 'A.B' });
    expect(parsed.kind === 'name' && parsed.args).toHaveLength(2);
  });

  it('does not mistake two siblings for one wrapped type', () => {
    const parsed = parseClrType('A.B<[C],[D]>');

    expect(parsed.kind === 'name' && parsed.args.map(argument => argument.kind)).toEqual([
      'array',
      'array',
    ]);
  });
});

describe('typePoolKey', () => {
  it('is the name itself when there are no generics', () => {
    expect(typePoolKey(parseClrType('Volo.Abp.Identity.IdentityUserDto'))).toBe(
      'Volo.Abp.Identity.IdentityUserDto',
    );
  });

  it('is the open generic ABP files the definition under', () => {
    expect(typePoolKey(parseClrType('Volo.Abp.Application.Dtos.PagedResultDto<Volo.X>'))).toBe(
      'Volo.Abp.Application.Dtos.PagedResultDto<T0>',
    );
    expect(typePoolKey(parseClrType('A.B<C,D>'))).toBe('A.B<T0,T1>');
  });
});

describe('namedTypes', () => {
  it('finds every name a type refers to', () => {
    const names = namedTypes(parseClrType('{string:[A.B<C.D>]}')).map(type => type.name);

    expect(names).toEqual(['string', 'A.B', 'C.D']);
  });
});
