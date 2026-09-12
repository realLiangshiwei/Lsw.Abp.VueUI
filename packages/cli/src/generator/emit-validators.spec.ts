import { describe, expect, it } from 'vitest';
import type { PropertyDefinition, TypeDefinition } from '../api-definition/models.js';
import type { ObjectExtensions } from '../api-definition/object-extensions.js';
import { emitDtoValidators, emitExtensionValidators } from './emit-validators.js';
import { GenerationReport } from './report.js';
import { TypeRegistry } from './type-registry.js';

const property = (name: string, extra: Partial<PropertyDefinition> = {}): PropertyDefinition => ({
  name,
  jsonName: null,
  type: 'System.String',
  typeSimple: 'string',
  isRequired: false,
  isNullable: false,
  ...extra,
});

function dtoValidators(properties: PropertyDefinition[]) {
  const report = new GenerationReport();
  const types: Record<string, TypeDefinition> = {
    'Acme.Books.BookDto': {
      baseType: null,
      isEnum: false,
      enumNames: null,
      enumValues: null,
      genericArguments: null,
      properties,
    },
  };
  const registry = new TypeRegistry(types, { report });
  const files = emitDtoValidators(registry.generated(), report);

  return { report, files, content: files[0]?.content ?? '' };
}

describe('the validators of a DTO', () => {
  it('sit next to the models of their namespace', () => {
    const { files } = dtoValidators([property('Name', { isRequired: true })]);

    expect(files.map(file => file.path)).toEqual(['acme/books/validators.ts']);
  });

  it('are typed against the DTO, so a renamed property stops compiling', () => {
    const { content } = dtoValidators([property('Name', { isRequired: true })]);

    expect(content).toContain('export const bookDtoValidators = {');
    expect(content).toContain('} satisfies ValidatorMap<BookDto>;');
    expect(content).toContain("import type { BookDto } from './models.js';");
  });

  it('carry the rules the data annotations state', () => {
    const { content } = dtoValidators([
      property('Name', { isRequired: true, maxLength: 128, minLength: 2 }),
      property('Age', { minimum: '0', maximum: '150' }),
      property('Website', { regex: '^https?://.+' }),
    ]);

    expect(content).toContain(
      'name: [Validators.required(), Validators.maxLength(128), Validators.minLength(2)],',
    );
    expect(content).toContain('age: [Validators.range(0, 150)],');
    expect(content).toContain('website: [Validators.pattern(new RegExp("^https?://.+"))],');
  });

  it('leave out a minimum of zero, which is what StringLength reports for none', () => {
    const { content } = dtoValidators([property('Note', { maxLength: 256, minLength: 0 })]);

    expect(content).toContain('note: [Validators.maxLength(256)],');
  });

  it('are written only for the properties that have rules', () => {
    const { files } = dtoValidators([property('Name'), property('Surname')]);

    expect(files).toEqual([]);
  });

  it('say so when a range is over something that is not a number', () => {
    const { report } = dtoValidators([property('Published', { minimum: '2020-01-01' })]);

    expect(report.of('unmapped-attribute')[0]).toMatch(/\[Range\] on Published/);
  });
});

describe('the validators of an object extension property', () => {
  const extensions: ObjectExtensions = {
    modules: {
      Identity: {
        entities: {
          User: {
            properties: {
              SocialSecurityNumber: {
                attributes: [
                  { typeSimple: 'required', config: { allowEmptyStrings: false } },
                  { typeSimple: 'stringLength', config: { maximumLength: 64, minimumLength: 4 } },
                ],
              },
              Nickname: {
                attributes: [{ typeSimple: 'required', config: { allowEmptyStrings: true } }],
              },
              HireDate: { attributes: [] },
              Title: {
                attributes: [
                  { typeSimple: 'required', config: {} },
                  { typeSimple: 'enumDataType', config: {} },
                ],
              },
            },
          },
        },
      },
    },
  };

  const report = new GenerationReport();
  const [file] = emitExtensionValidators(extensions, report);
  const content = file?.content ?? '';

  it('are one file, keyed by the name the backend declared', () => {
    expect(file?.path).toBe('object-extension-validators.ts');
    expect(content).toContain('export const identityUserExtensionValidators = {');
    expect(content).toContain(
      'SocialSecurityNumber: [Validators.required(), Validators.maxLength(64), Validators.minLength(4)],',
    );
  });

  it('leave out a required that allows empty strings, which the server accepts', () => {
    expect(content).not.toContain('Nickname');
  });

  it('leave out a property that declares nothing', () => {
    expect(content).not.toContain('HireDate');
  });

  it('report an attribute that has no client-side meaning instead of dropping it', () => {
    expect(report.of('unmapped-attribute')).toEqual([
      '[enumDataType] on Title has no validator here; the server still enforces it.',
    ]);
  });
});
