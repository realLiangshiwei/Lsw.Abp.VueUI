import { describe, expect, it } from 'vitest';
import type { TypeDefinition } from '../api-definition/models.js';
import { parseClrType } from './clr-type.js';
import { GenerationReport } from './report.js';
import { stripRootNamespace, TypeRegistry } from './type-registry.js';

function registry(types: Record<string, TypeDefinition>, rootNamespace?: string) {
  const report = new GenerationReport();
  return { registry: new TypeRegistry(types, { rootNamespace, report }), report };
}

const dto = (definition: Partial<TypeDefinition> = {}): TypeDefinition => ({
  baseType: null,
  isEnum: false,
  enumNames: null,
  enumValues: null,
  genericArguments: null,
  properties: null,
  ...definition,
});

describe('rendering a type', () => {
  const { registry: types } = registry({
    'Volo.Abp.Identity.IdentityUserDto': dto(),
    'Volo.Abp.Application.Dtos.PagedResultDto<T0>': dto({ genericArguments: ['T'] }),
  });

  const render = (text: string, scope?: Set<string>) =>
    types.render(parseClrType(text), scope).text;

  it('maps what ABP already simplified', () => {
    expect(render('string')).toBe('string');
    expect(render('boolean')).toBe('boolean');
    expect(render('System.Void')).toBe('void');
  });

  it('maps object to unknown, so the caller has to say what it is', () => {
    expect(render('object')).toBe('unknown');
    expect(render('System.Object')).toBe('unknown');
  });

  it('maps the BCL types a nested position leaves spelled out', () => {
    expect(render('System.Guid')).toBe('string');
    expect(render('System.Int32')).toBe('number');
    expect(render('System.DateTime')).toBe('string');
  });

  it('reads a collection as an array', () => {
    expect(render('[string]')).toBe('string[]');
    expect(render('System.Collections.Generic.List<System.String>')).toBe('string[]');
  });

  it('reads a dictionary as a record', () => {
    expect(render('{string:boolean}')).toBe('Record<string, boolean>');
    expect(render('{string:System.Collections.Generic.Dictionary<string,string>}')).toBe(
      'Record<string, Record<string, string>>',
    );
  });

  it('keeps a generic argument as written', () => {
    expect(
      render('Volo.Abp.Application.Dtos.PagedResultDto<Volo.Abp.Identity.IdentityUserDto>'),
    ).toBe('PagedResultDto<IdentityUserDto>');
  });

  it('leaves a type parameter alone when it is in scope', () => {
    expect(render('[T]', new Set(['T']))).toBe('T[]');
    expect(render('TKey', new Set(['TKey']))).toBe('TKey');
  });

  it('sends a stream to Blob, in both directions', () => {
    expect(render('Volo.Abp.Content.IRemoteStreamContent')).toBe('Blob');
    expect(render('[Volo.Abp.Content.RemoteStreamContent]')).toBe('Blob[]');
  });

  it('says so when a type is not in the pool', () => {
    const { registry: empty, report } = registry({});

    expect(empty.render(parseClrType('Acme.Missing')).text).toBe('unknown');
    expect(report.of('unresolved')).toEqual([
      'Acme.Missing is not in the type pool; generated as unknown.',
    ]);
  });

  it('collects the pool types the text mentions, for the imports', () => {
    const rendered = types.render(
      parseClrType('Volo.Abp.Application.Dtos.PagedResultDto<Volo.Abp.Identity.IdentityUserDto>'),
    );

    expect(rendered.refs.map(ref => ref.identifier)).toEqual(['PagedResultDto', 'IdentityUserDto']);
  });
});

describe('the framework types', () => {
  it('come from core rather than being generated again', () => {
    const { registry: types } = registry({
      'Volo.Abp.Application.Dtos.PagedResultDto<T0>': dto({ genericArguments: ['T'] }),
      'Volo.Abp.Identity.IdentityUserDto': dto(),
    });

    expect(types.get('Volo.Abp.Application.Dtos.PagedResultDto<T0>')?.frameworkName).toBe(
      'PagedResultDto',
    );
    expect(types.generated().map(type => type.identifier)).toEqual(['IdentityUserDto']);
  });
});

describe('two types with one name', () => {
  const { registry: types, report } = registry({
    'Acme.Books.BookDto': dto(),
    'Acme.Authors.BookDto': dto(),
  });

  it('keeps the first by name and puts the namespace in front of the other', () => {
    const identifiers = [
      types.get('Acme.Authors.BookDto')?.identifier,
      types.get('Acme.Books.BookDto')?.identifier,
    ];

    expect(identifiers).toEqual(['BookDto', 'BooksBookDto']);
  });

  it('says which one was renamed', () => {
    expect(report.of('renamed')).toEqual([
      'Acme.Books.BookDto is generated as BooksBookDto, because BookDto is taken.',
    ]);
  });
});

describe('a non-generic type over its own generic form', () => {
  it('becomes one type whose parameter has the default it was closed with', () => {
    const { registry: types } = registry({
      'Acme.Pair': dto({ baseType: 'Acme.Pair<System.String>' }),
      'Acme.Pair<T0>': dto({ genericArguments: ['T'] }),
    });

    const generic = types.get('Acme.Pair<T0>');

    expect(generic?.identifier).toBe('Pair');
    expect(generic?.genericDefaults).toEqual(['string']);
  });
});

describe('stripRootNamespace', () => {
  it('takes the project namespace off the front', () => {
    expect(stripRootNamespace('Acme.BookStore.Books', 'Acme.BookStore')).toBe('Books');
    expect(stripRootNamespace('Acme.BookStore', 'Acme.BookStore')).toBe('');
  });

  it('drops the Controllers segment ABP puts its controllers in', () => {
    expect(stripRootNamespace('Acme.BookStore.Controllers.Books', 'Acme.BookStore')).toBe('Books');
  });

  it('leaves a namespace that is not under the root alone', () => {
    expect(stripRootNamespace('Volo.Abp.Identity', 'Acme.BookStore')).toBe('Volo.Abp.Identity');
    expect(stripRootNamespace('Volo.Abp.Identity', undefined)).toBe('Volo.Abp.Identity');
  });
});
