import { describe, expect, it } from 'vitest';
import type { TypeDefinition } from '../api-definition/models.js';
import { emitModels, fileOf } from './emit-models.js';
import { GenerationReport } from './report.js';
import { TypeRegistry } from './type-registry.js';

const dto = (definition: Partial<TypeDefinition> = {}): TypeDefinition => ({
  baseType: null,
  isEnum: false,
  enumNames: null,
  enumValues: null,
  genericArguments: null,
  properties: null,
  ...definition,
});

const property = (
  name: string,
  typeSimple: string,
  extra: Partial<
    TypeDefinition['properties'] extends (infer T)[] | null | undefined ? T : never
  > = {},
) => ({
  name,
  jsonName: null,
  type: typeSimple,
  typeSimple,
  isRequired: false,
  isNullable: false,
  ...extra,
});

function emit(
  types: Record<string, TypeDefinition>,
  rootNamespace?: string,
  directions?: Map<string, 'request' | 'response' | 'both'>,
) {
  const report = new GenerationReport();
  const registry = new TypeRegistry(types, { rootNamespace, report });
  const files = emitModels(registry.generated(), registry, report, directions);

  return {
    files,
    report,
    content: (path: string) => files.find(file => file.path === path)?.content,
  };
}

describe('an interface', () => {
  it('is written to models.ts under its namespace', () => {
    const { files } = emit({ 'Acme.Books.BookDto': dto() });

    expect(files.map(file => file.path)).toEqual(['acme/books/models.ts']);
  });

  it('names its properties the way they arrive on the wire', () => {
    const { content } = emit({
      'Acme.Books.BookDto': dto({
        properties: [property('Name', 'string'), property('PublishDate', 'string')],
      }),
    });

    expect(content('acme/books/models.ts')).toContain('name?: string | undefined;');
    expect(content('acme/books/models.ts')).toContain('publishDate?: string | undefined;');
  });

  it('honours a jsonName the backend chose, quoting it when it needs quoting', () => {
    const { content } = emit({
      'Acme.Books.BookDto': dto({
        properties: [
          property('Name', 'string', { jsonName: 'book_name' }),
          property('Author', 'string', { jsonName: 'book-author' }),
        ],
      }),
    });

    expect(content('acme/books/models.ts')).toContain('book_name?: string | undefined;');
    expect(content('acme/books/models.ts')).toContain("'book-author'?: string | undefined;");
  });

  it('is optional unless the backend requires it, and says undefined out loud', () => {
    const { content } = emit({
      'Acme.Books.BookDto': dto({
        properties: [
          property('Name', 'string', { isRequired: true }),
          property('Author', 'string'),
        ],
      }),
    });

    expect(content('acme/books/models.ts')).toContain('name: string;');
    expect(content('acme/books/models.ts')).toContain('author?: string | undefined;');
  });

  it('admits null where the backend says the value may be null', () => {
    const { content } = emit({
      'Acme.Books.BookDto': dto({
        properties: [property('TenantId', 'string?', { isNullable: true })],
      }),
    });

    expect(content('acme/books/models.ts')).toContain('tenantId?: string | null | undefined;');
  });

  it('extends its base type', () => {
    const { content } = emit({
      'Acme.Books.BookDto': dto({ baseType: 'Acme.Books.BookBase' }),
      'Acme.Books.BookBase': dto({ properties: [property('Name', 'string')] }),
    });

    expect(content('acme/books/models.ts')).toContain('export type BookDto = BookBase;');
  });

  it('imports a base type core already declares', () => {
    const { content } = emit({
      'Acme.Books.BookDto': dto({
        baseType: 'Volo.Abp.Application.Dtos.ExtensibleEntityDto<System.Guid>',
        properties: [property('Name', 'string')],
      }),
      'Volo.Abp.Application.Dtos.ExtensibleEntityDto<T0>': dto({ genericArguments: ['TKey'] }),
    });

    expect(content('acme/books/models.ts')).toContain(
      "import type { ExtensibleEntityDto } from '@lsw-abpvue/core';",
    );
    expect(content('acme/books/models.ts')).toContain(
      'export interface BookDto extends ExtensibleEntityDto<string> {',
    );
  });

  it('imports a type from another namespace by relative path', () => {
    const { content } = emit({
      'Acme.Books.BookDto': dto({ properties: [property('Author', 'Acme.Authors.AuthorDto')] }),
      'Acme.Authors.AuthorDto': dto(),
    });

    expect(content('acme/books/models.ts')).toContain(
      "import type { AuthorDto } from '../authors/models.js';",
    );
  });

  it('does not import what sits in the same file', () => {
    const { content } = emit({
      'Acme.Books.BookDto': dto({ properties: [property('Author', 'Acme.Books.AuthorDto')] }),
      'Acme.Books.AuthorDto': dto(),
    });

    expect(content('acme/books/models.ts')?.startsWith('export interface')).toBe(true);
  });

  it('keeps its generic parameters', () => {
    const { content } = emit({
      'Acme.Books.Page<T0>': dto({
        genericArguments: ['T'],
        properties: [property('Items', '[T]')],
      }),
    });

    expect(content('acme/books/models.ts')).toContain('export interface Page<T> {');
    expect(content('acme/books/models.ts')).toContain('items?: T[] | undefined;');
  });
});

describe('an enum', () => {
  const { files, content } = emit({
    'Acme.Books.BookType': dto({
      isEnum: true,
      enumNames: ['Undefined', 'Adventure'],
      enumValues: [0, 1],
    }),
  });

  it('is a file of its own', () => {
    expect(files.map(file => file.path)).toEqual(['acme/books/book-type.enum.ts']);
  });

  it('carries the members and the options a select needs', () => {
    expect(content('acme/books/book-type.enum.ts')).toBe(
      [
        "import { mapEnumToOptions } from '@lsw-abpvue/core';",
        '',
        'export enum BookType {',
        '  Undefined = 0,',
        '  Adventure = 1,',
        '}',
        '',
        'export const bookTypeOptions = mapEnumToOptions(BookType);',
        '',
      ].join('\n'),
    );
  });
});

describe('the root namespace', () => {
  it('is taken off the directory, so an application sits shallow', () => {
    const { files } = emit({ 'Acme.BookStore.Books.BookDto': dto() }, 'Acme.BookStore');

    expect(files.map(file => file.path)).toEqual(['books/models.ts']);
  });
});

describe('two enums whose names differ only in case', () => {
  it('are two identifiers but one file name, which is what the duplicate check is for', () => {
    const { files } = emit({
      'Acme.Books.AB': dto({ isEnum: true, enumNames: ['One'], enumValues: [0] }),
      'Acme.Books.Ab': dto({ isEnum: true, enumNames: ['Two'], enumValues: [0] }),
    });

    expect(files.map(file => file.path)).toEqual([
      'acme/books/ab.enum.ts',
      'acme/books/ab.enum.ts',
    ]);
  });
});

describe('fileOf', () => {
  it('says where a type will be, so another file can import it from there', () => {
    const report = new GenerationReport();
    const registry = new TypeRegistry({ 'Acme.Books.BookDto': dto() }, { report });
    const [type] = registry.generated();

    expect(type && fileOf(type)).toBe('acme/books/models');
  });
});

describe('a DTO the server writes', () => {
  const responses = new Map<string, 'request' | 'response' | 'both'>([
    ['Acme.Books.BookDto', 'response'],
  ]);

  const bookDto = (properties: ReturnType<typeof property>[]) =>
    emit({ 'Acme.Books.BookDto': dto({ properties }) }, undefined, responses).content(
      'acme/books/models.ts',
    );

  it('requires a value type, which cannot be null and is always written', () => {
    const content = bookDto([
      property('IsPublished', 'boolean', { type: 'System.Boolean' }),
      property('PageCount', 'number', { type: 'System.Int32' }),
      property('PublishedAt', 'string', { type: 'System.DateTime' }),
    ]);

    expect(content).toContain('isPublished: boolean;');
    expect(content).toContain('pageCount: number;');
    expect(content).toContain('publishedAt: string;');
  });

  it('requires an enum, for the same reason', () => {
    const content = emit(
      {
        'Acme.Books.BookDto': dto({
          properties: [property('Kind', 'enum', { type: 'Acme.Books.BookKind' })],
        }),
        'Acme.Books.BookKind': dto({ isEnum: true, enumNames: ['Novel'], enumValues: [0] }),
      },
      undefined,
      responses,
    ).content('acme/books/models.ts');

    expect(content).toContain('kind: BookKind;');
  });

  it('leaves a nullable value type optional', () => {
    const content = bookDto([
      property('PageCount', 'number?', { type: 'System.Int32?', isNullable: true }),
    ]);

    expect(content).toContain('pageCount?: number | null | undefined;');
  });

  it('leaves a string optional, because ABP cannot promise otherwise', () => {
    // Its own modules compile without nullable reference types, so a `string` is
    // reported non-nullable whether or not it comes back as null.
    const content = bookDto([property('Name', 'string', { type: 'System.String' })]);

    expect(content).toContain('name?: string | undefined;');
  });

  it('leaves a collection and another DTO optional, for the same reason', () => {
    const content = emit(
      {
        'Acme.Books.BookDto': dto({
          properties: [
            property('Tags', '[string]', { type: '[System.String]' }),
            property('Author', 'Acme.Books.AuthorDto', { type: 'Acme.Books.AuthorDto' }),
          ],
        }),
        'Acme.Books.AuthorDto': dto(),
      },
      undefined,
      responses,
    ).content('acme/books/models.ts');

    expect(content).toContain('tags?: string[] | undefined;');
    expect(content).toContain('author?: AuthorDto | undefined;');
  });
});

describe('a DTO the caller builds', () => {
  it('requires what the backend marks required and nothing else', () => {
    const content = emit(
      {
        'Acme.Books.BookDto': dto({
          properties: [
            property('Name', 'string', { type: 'System.String', isRequired: true }),
            property('IsPublished', 'boolean', { type: 'System.Boolean' }),
          ],
        }),
      },
      undefined,
      new Map([['Acme.Books.BookDto', 'request' as const]]),
    ).content('acme/books/models.ts');

    expect(content).toContain('name: string;');
    expect(content).toContain('isPublished?: boolean | undefined;');
  });

  it('takes the caller rule when the DTO travels both ways', () => {
    const content = emit(
      {
        'Acme.Books.BookDto': dto({
          properties: [property('IsPublished', 'boolean', { type: 'System.Boolean' })],
        }),
      },
      undefined,
      new Map([['Acme.Books.BookDto', 'both' as const]]),
    ).content('acme/books/models.ts');

    expect(content).toContain('isPublished?: boolean | undefined;');
  });
});
