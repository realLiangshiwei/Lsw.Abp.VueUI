import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type {
  ActionDefinition,
  ControllerDefinition,
  ModuleDefinition,
  TypeDefinition,
} from '../api-definition/models.js';
import { emitServices } from './emit-services.js';
import { GenerationReport } from './report.js';
import { TypeRegistry } from './type-registry.js';

const action = (definition: Partial<ActionDefinition>): ActionDefinition => ({
  uniqueName: 'GetAsync',
  name: 'GetAsync',
  httpMethod: 'GET',
  url: 'api/books',
  supportedVersions: [],
  parametersOnMethod: [],
  parameters: [],
  returnValue: { type: 'System.Void', typeSimple: 'System.Void' },
  ...definition,
});

const controller = (actions: Record<string, ActionDefinition>): ControllerDefinition => ({
  controllerName: 'Book',
  controllerGroupName: 'Book',
  isRemoteService: true,
  isIntegrationService: false,
  type: 'Acme.Books.BookController',
  actions,
});

function emit(
  actions: Record<string, ActionDefinition>,
  types: Record<string, TypeDefinition> = {},
) {
  const report = new GenerationReport();
  const registry = new TypeRegistry(types, { report });
  const module: ModuleDefinition = {
    rootPath: 'books',
    remoteServiceName: 'AcmeBooks',
    controllers: {},
  };

  const services = emitServices([controller(actions)], {
    module,
    registry,
    report,
    names: new Map(),
  });

  return { report, content: services.files[0]?.content ?? '', path: services.files[0]?.path };
}

describe('a service', () => {
  it.each([
    ['Volo.Abp.Data.ExtraPropertyDictionary', '{string:object}', 'ModelBinding'],
    ['{System.String:System.Object}', '{string:object}', 'Query'],
    ['Acme.PropertyBag', '{string:string}', 'ModelBinding'],
  ])('keeps a named query dictionary for %s', (type, typeSimple, bindingSourceId) => {
    const { content } = emit({
      GetListAsyncByInput: action({
        uniqueName: 'GetListAsyncByInput',
        parametersOnMethod: [
          {
            name: 'input',
            type: 'Acme.QueryInput',
            typeSimple: 'Acme.QueryInput',
            isOptional: false,
          },
        ],
        parameters: [
          {
            nameOnMethod: 'input',
            name: 'ExtraProperties',
            descriptorName: 'input',
            type,
            typeSimple,
            isOptional: false,
            bindingSourceId,
          },
        ],
      }),
    });

    expect(content).toContain('params: { extraProperties: input.extraProperties }');
    expect(content).not.toContain('...input.extraProperties');
  });

  it.each([
    ['System.Collections.Generic.Dictionary<System.String,System.Object>', '{string:object}'],
    ['System.Collections.Generic.IDictionary<System.String,System.Object>', '{string:object}'],
    ['Dictionary<string,string>', '{string:string}'],
    ['Acme.PropertyBag', 'IDictionary<string,string>'],
  ])(
    'keeps the query entry convention for CLR dictionaries described by %s',
    (type, typeSimple) => {
      const { content } = emit({
        GetListAsyncByFilters: action({
          uniqueName: 'GetListAsyncByFilters',
          parametersOnMethod: [{ name: 'filters', type, typeSimple, isOptional: false }],
          parameters: [
            {
              nameOnMethod: 'filters',
              name: 'filters',
              type,
              typeSimple,
              isOptional: false,
              bindingSourceId: 'Query',
            },
          ],
        }),
      });

      expect(content).toContain('params: { ...filters }');
      expect(content).not.toContain('params: { filters }');
    },
  );

  it('keeps a required nullable query value distinct from an optional argument', () => {
    const { content } = emit({
      MoveAllUsersAsync: action({
        uniqueName: 'MoveAllUsersAsync',
        httpMethod: 'PUT',
        url: 'api/roles/{id}/move-all-users',
        parametersOnMethod: [
          { name: 'id', type: 'System.Guid', typeSimple: 'string', isOptional: false },
          { name: 'roleId', type: 'System.Guid?', typeSimple: 'string?', isOptional: false },
        ],
        parameters: [
          {
            nameOnMethod: 'id',
            name: 'id',
            type: 'System.Guid',
            typeSimple: 'string',
            isOptional: false,
            bindingSourceId: 'Path',
          },
          {
            nameOnMethod: 'roleId',
            name: 'roleId',
            type: 'System.Guid?',
            typeSimple: 'string?',
            isOptional: false,
            bindingSourceId: 'Query',
          },
        ],
      }),
    });
    expect(content).toContain(
      'moveAllUsers: (id: string, roleId: string | null, config?: RestConfig)',
    );
    expect(content).toContain('params: { roleId }');
  });

  it('is one file per controller, named after it', () => {
    const { path, content } = emit({ GetAsync: action({}) });

    expect(path).toBe('acme/books/book.service.ts');
    expect(content).toContain("export const BookService = defineService('BookService', () => {");
    expect(content).toContain("const apiName = 'AcmeBooks';");
    expect(content).toContain('export type BookService = ServiceOf<typeof BookService>;');
  });

  it('drops the Async suffix ABP builds the unique name from', () => {
    const { content } = emit({
      GetListAsyncByInput: action({ uniqueName: 'GetListAsyncByInput' }),
    });

    expect(content).toContain('getList: (config?: RestConfig)');
  });

  it('encodes a path parameter as one URL segment', () => {
    const { content } = emit({
      GetAsyncById: action({
        uniqueName: 'GetAsyncById',
        url: 'api/books/{id}',
        parametersOnMethod: [
          { name: 'id', type: 'System.Guid', typeSimple: 'string', isOptional: false },
        ],
        parameters: [
          {
            nameOnMethod: 'id',
            name: 'id',
            type: 'System.Guid',
            typeSimple: 'string',
            isOptional: false,
            bindingSourceId: 'Path',
            descriptorName: '',
          },
        ],
      }),
    });

    expect(content).toContain('get: (id: string, config?: RestConfig)');
    expect(content).toContain('url: `/api/books/${encodeURIComponent(String(id))}`');
  });

  it('reads a flattened query parameter off the input it came from', () => {
    const { content } = emit(
      {
        GetListAsyncByInput: action({
          uniqueName: 'GetListAsyncByInput',
          parametersOnMethod: [
            {
              name: 'input',
              type: 'Acme.Books.GetBooksInput',
              typeSimple: 'Acme.Books.GetBooksInput',
              isOptional: false,
            },
          ],
          parameters: [
            {
              nameOnMethod: 'input',
              name: 'Filter',
              type: 'System.String',
              typeSimple: 'string',
              isOptional: false,
              bindingSourceId: 'ModelBinding',
              descriptorName: 'input',
            },
          ],
        }),
      },
      {
        'Acme.Books.GetBooksInput': {
          baseType: null,
          isEnum: false,
          enumNames: null,
          enumValues: null,
          genericArguments: null,
          properties: null,
        },
      },
    );

    expect(content).toContain('params: { filter: input.filter }');
  });

  it('chains an optional input, because the caller may leave it out', () => {
    const { content } = emit({
      GetListAsyncByInput: action({
        uniqueName: 'GetListAsyncByInput',
        parametersOnMethod: [
          { name: 'input', type: 'System.String', typeSimple: 'string', isOptional: true },
        ],
        parameters: [
          {
            nameOnMethod: 'input',
            name: 'Filter',
            type: 'System.String',
            typeSimple: 'string',
            isOptional: true,
            bindingSourceId: 'ModelBinding',
            descriptorName: 'input',
          },
        ],
      }),
    });

    expect(content).toContain('params: { filter: input?.filter }');
    expect(content).toContain('input?: string');
  });

  it('sends a body and says what type it is', () => {
    const { content } = emit(
      {
        CreateAsyncByInput: action({
          uniqueName: 'CreateAsyncByInput',
          httpMethod: 'POST',
          parametersOnMethod: [
            {
              name: 'input',
              type: 'Acme.Books.BookDto',
              typeSimple: 'Acme.Books.BookDto',
              isOptional: false,
            },
          ],
          parameters: [
            {
              nameOnMethod: 'input',
              name: 'input',
              type: 'Acme.Books.BookDto',
              typeSimple: 'Acme.Books.BookDto',
              isOptional: false,
              bindingSourceId: 'Body',
              descriptorName: '',
            },
          ],
          returnValue: { type: 'Acme.Books.BookDto', typeSimple: 'Acme.Books.BookDto' },
        }),
      },
      {
        'Acme.Books.BookDto': {
          baseType: null,
          isEnum: false,
          enumNames: null,
          enumValues: null,
          genericArguments: null,
          properties: null,
        },
      },
    );

    expect(content).toContain('rest.request<BookDto, BookDto>(');
    expect(content).toContain('body: input');
  });

  it.each(['string', 'string?'])(
    'sends a %s body as JSON, which is what the server reads it as',
    typeSimple => {
      const { content } = emit({
        SetAsyncByValue: action({
          uniqueName: 'SetAsyncByValue',
          httpMethod: 'POST',
          parametersOnMethod: [
            { name: 'value', type: 'System.String', typeSimple, isOptional: false },
          ],
          parameters: [
            {
              nameOnMethod: 'value',
              name: 'value',
              type: 'System.String',
              typeSimple,
              isOptional: false,
              bindingSourceId: 'Body',
              descriptorName: '',
            },
          ],
        }),
      });

      expect(content).toContain('body: JSON.stringify(value)');
      expect(content).toContain("headers: { 'Content-Type': 'application/json' }");
    },
  );

  it('forwards mutable and readonly array bodies through a compatible request type', async () => {
    const { content } = emit({
      ReplaceAsyncByInput: action({
        uniqueName: 'ReplaceAsyncByInput',
        httpMethod: 'PUT',
        parametersOnMethod: [
          { name: 'input', type: '[System.String]', typeSimple: '[string]', isOptional: false },
        ],
        parameters: [
          {
            nameOnMethod: 'input',
            name: 'input',
            type: '[System.String]',
            typeSimple: '[string]',
            isOptional: false,
            bindingSourceId: 'Body',
            descriptorName: '',
          },
        ],
      }),
    });

    const directory = await mkdtemp(join(tmpdir(), 'abpvue-array-body-'));
    try {
      const source = join(directory, 'proxy.ts');
      const httpTypes = resolve(import.meta.dirname, '../../../core/src/models/http.js');
      await writeFile(
        source,
        `import type { HttpRequestConfig, RestConfig } from ${JSON.stringify(httpTypes)};
declare function defineService<T>(name: string, factory: () => T): T;
declare function inject<T>(token: T): T;
type ServiceOf<T> = T;
declare const RestService: {
  request<TBody, TResult>(request: HttpRequestConfig<TBody>, config?: RestConfig): Promise<TResult>;
};
${content.replace(/^import .*;\n/gm, '')}
const mutable: string[] = ['first'];
const immutable = ['second'] as const;
BookService.replace(mutable);
BookService.replace(immutable);
`,
      );
      const compiler = resolve(import.meta.dirname, '../../../../node_modules/typescript/bin/tsc');
      const diagnostics = await new Promise<string>(resolveDiagnostics => {
        execFile(
          process.execPath,
          [
            compiler,
            '--ignoreConfig',
            '--noEmit',
            '--strict',
            '--skipLibCheck',
            '--module',
            'ESNext',
            '--moduleResolution',
            'bundler',
            '--target',
            'ES2022',
            source,
          ],
          (error, stdout, stderr) =>
            resolveDiagnostics(error ? `${stdout}${stderr}` || error.message : ''),
        );
      });
      expect(diagnostics).toBe('');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('takes FormData for an upload and posts it as the body', () => {
    const { content } = emit({
      UploadAsyncByFile: action({
        uniqueName: 'UploadAsyncByFile',
        httpMethod: 'POST',
        url: 'api/books/{id}/cover',
        parametersOnMethod: [
          { name: 'id', type: 'System.Guid', typeSimple: 'string', isOptional: false },
          {
            name: 'file',
            type: 'Volo.Abp.Content.IRemoteStreamContent',
            typeSimple: 'Volo.Abp.Content.IRemoteStreamContent',
            isOptional: false,
          },
        ],
        parameters: [
          {
            nameOnMethod: 'id',
            name: 'id',
            type: 'System.Guid',
            typeSimple: 'string',
            isOptional: false,
            bindingSourceId: 'Path',
            descriptorName: '',
          },
          {
            nameOnMethod: 'file',
            name: 'file',
            type: 'Volo.Abp.Content.IRemoteStreamContent',
            typeSimple: 'Volo.Abp.Content.IRemoteStreamContent',
            isOptional: false,
            bindingSourceId: 'FormFile',
            descriptorName: '',
          },
        ],
      }),
    });

    expect(content).toContain('upload: (id: string, file: FormData, config?: RestConfig)');
    expect(content).toContain('rest.request<FormData, void>(');
    expect(content).toContain('body: file');
  });

  it('asks for a blob when the endpoint answers with a stream', () => {
    const { content } = emit({
      DownloadAsync: action({
        uniqueName: 'DownloadAsync',
        returnValue: {
          type: 'Volo.Abp.Content.IRemoteStreamContent',
          typeSimple: 'Volo.Abp.Content.IRemoteStreamContent',
          isRemoteStream: true,
        },
      }),
    });

    expect(content).toContain("responseType: 'blob'");
    expect(content).toContain('Promise<Blob>');
  });

  it('asks for text when the endpoint answers with a bare string', () => {
    const { content } = emit({
      GetNameAsync: action({
        uniqueName: 'GetNameAsync',
        returnValue: { type: 'System.String', typeSimple: 'string' },
      }),
    });

    expect(content).toContain("responseType: 'text'");
    expect(content).toContain('Promise<string>');
  });

  it('gives two actions of the same name longer ones, and says so', () => {
    const { content, report } = emit({
      GetAsyncById: action({ uniqueName: 'GetAsyncById', url: 'api/books/{id}' }),
      GetAsyncByName: action({ uniqueName: 'GetAsyncByName', url: 'api/books/by-name/{name}' }),
    });

    expect(content).toContain('getById:');
    expect(content).toContain('getByName:');
    expect(report.of('renamed-method')).toHaveLength(2);
  });
});
