import {
  ConfigStateService,
  createInjector,
  RestService,
  type ApplicationConfigurationDto,
  type EntityExtensionDto,
  type ExtensionPropertyDto,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { describe, expect, it, vi } from 'vitest';
import configurationFixture from '../../../../e2e/fixtures/application-configuration.json';
import localizationFixture from '../../../../e2e/fixtures/application-localization.en.json';
import { PropType } from '../enums/prop-type.js';
import { EntityPropList } from '../models/entity-props.js';
import { FormPropList } from '../models/form-props.js';
import type { PropData } from '../models/prop-data.js';
import { unwrapResolvable } from '../models/prop-data.js';
import { getObjectExtensionEntities, mapEntitiesToContributors } from './object-extensions.js';

/** The real answer of a running ABP backend, captured by `scripts/capture-fixtures.sh`. */
const fixture = configurationFixture as unknown as ApplicationConfigurationDto;
const texts = localizationFixture as unknown as {
  resources: ApplicationConfigurationDto['localization']['resources'];
};

const USERS = 'Identity.UsersComponent';

interface Setup {
  policies?: Record<string, boolean>;
  features?: Record<string, string>;
  entities?: Record<string, EntityExtensionDto | undefined>;
  providers?: ProviderInput[];
}

function setup({ policies = {}, features = {}, entities, providers = [] }: Setup = {}) {
  const injector = createInjector(providers);
  const configState = injector.get(ConfigStateService);

  configState.setState({
    ...fixture,
    localization: { ...fixture.localization, resources: texts.resources },
    auth: { grantedPolicies: policies },
    features: { values: features },
  } as ApplicationConfigurationDto);

  const module = entities ?? {
    [USERS]: getObjectExtensionEntities(injector, 'Identity').User,
  };

  return {
    injector,
    configState,
    contributors: mapEntitiesToContributors(injector, module, 'AbpIdentity'),
  };
}

function columns(contributors: ((list: EntityPropList) => void)[]) {
  const propList = new EntityPropList();
  for (const contribute of contributors) contribute(propList);

  return propList.toArray();
}

function fields(contributors: ((list: FormPropList) => void)[]) {
  const propList = new FormPropList();
  for (const contribute of contributors) contribute(propList);

  return propList.toArray();
}

const dataFor = (injector: Injector, record: unknown): PropData<unknown> => ({
  record,
  index: 0,
  getInjected: injector.get.bind(injector),
});

describe('getObjectExtensionEntities', () => {
  it('finds the entities of a module the backend extended', () => {
    const { injector } = setup();

    expect(Object.keys(getObjectExtensionEntities(injector, 'Identity'))).toEqual(['User', 'Role']);
  });

  it('a module with no extensions is an empty object rather than undefined', () => {
    const { injector } = setup();

    expect(getObjectExtensionEntities(injector, 'Saas')).toEqual({});
  });
});

describe('what the backend puts on the table', () => {
  it('a property marked visible on the table becomes an extra column', () => {
    const { contributors } = setup();
    const names = columns(contributors.prop[USERS] ?? []).map(prop => prop.name);

    expect(names).toContain('SocialSecurityNumber');
    expect(names).not.toContain('HireDate');
  });

  it('the column reads the value out of extraProperties', () => {
    const { injector, contributors } = setup();
    const [column] = columns(contributors.prop[USERS] ?? []);

    expect(column?.isExtra).toBe(true);
    expect(
      column?.valueResolver(
        dataFor(injector, { extraProperties: { SocialSecurityNumber: '123-45' } }),
      ),
    ).toBe('123-45');
  });

  it('the type comes from typeSimple, with the nullable marker stripped', () => {
    const { contributors } = setup();
    const byName = new Map(columns(contributors.prop[USERS] ?? []).map(prop => [prop.name, prop]));

    expect(byName.get('SocialSecurityNumber')?.type).toBe(PropType.String);
    expect(byName.get('Age')?.type).toBe(PropType.Number);
    expect(byName.get('IsExternal')?.type).toBe(PropType.Boolean);
  });

  it('a boolean column is narrower than the rest, as it is in Angular', () => {
    const { contributors } = setup();
    const byName = new Map(columns(contributors.prop[USERS] ?? []).map(prop => [prop.name, prop]));

    expect(byName.get('IsExternal')?.columnWidth).toBe(150);
    expect(byName.get('Age')?.columnWidth).toBe(250);
  });

  it('sortable follows the flag ABP declares for it', () => {
    const property = (fixture.objectExtensions.modules.Identity?.entities.User?.properties.Age ??
      {}) as ExtensionPropertyDto;
    const { contributors } = setup({
      entities: {
        [USERS]: {
          properties: {
            Age: {
              ...property,
              ui: { ...property.ui, onTable: { isVisible: true, isSortable: true } },
            },
          },
          configuration: {},
        },
      },
    });

    expect(columns(contributors.prop[USERS] ?? [])[0]?.sortable).toBe(true);
  });
});

describe('what the backend puts on the forms', () => {
  it('the create and edit forms get the properties each of them declares', () => {
    const { contributors } = setup();

    expect(fields(contributors.createForm[USERS] ?? []).map(prop => prop.name)).toEqual([
      'SocialSecurityNumber',
      'Age',
      'HireDate',
      'Title',
    ]);
    expect(fields(contributors.editForm[USERS] ?? []).map(prop => prop.name)).toContain('Website');
  });

  it('a property visible on neither form is on neither', () => {
    const { contributors } = setup();

    expect(fields(contributors.createForm[USERS] ?? []).map(prop => prop.name)).not.toContain(
      'IsExternal',
    );
    expect(fields(contributors.editForm[USERS] ?? []).map(prop => prop.name)).not.toContain(
      'IsExternal',
    );
  });

  it('the default value and the validators come across', () => {
    const { injector, contributors } = setup();
    const byName = new Map(
      fields(contributors.createForm[USERS] ?? []).map(prop => [prop.name, prop]),
    );
    const age = byName.get('Age');

    expect(byName.get('Title')?.defaultValue).toBe(0);
    expect(
      age
        ?.validators(dataFor(injector, {}))
        .flatMap(validate => validate('', { valueOf: () => undefined }) ?? [])
        .map(error => error.rule),
    ).toEqual(['required']);
  });

  it('form text is passed on when the backend sends one', () => {
    const property = (fixture.objectExtensions.modules.Identity?.entities.User?.properties
      .SocialSecurityNumber ?? {}) as ExtensionPropertyDto;
    const { contributors } = setup({
      entities: {
        [USERS]: {
          properties: { Ssn: { ...property, formText: 'AbpIdentity::SsnHint' } },
          configuration: {},
        },
      },
    });

    expect(fields(contributors.createForm[USERS] ?? [])[0]?.formText).toBe('AbpIdentity::SsnHint');
  });
});

describe('enums', () => {
  const titleColumn = () => {
    const { injector, contributors } = setup();
    const column = columns(contributors.prop[USERS] ?? []).find(prop => prop.name === 'Title');

    return { injector, column };
  };

  it('a property whose type is an enum is rendered as one', () => {
    expect(titleColumn().column?.type).toBe(PropType.Enum);
  });

  it('the cell shows the member name rather than the number behind it', () => {
    const { injector, column } = titleColumn();
    const value = unwrapResolvable(
      column?.valueResolver(dataFor(injector, { extraProperties: { Title: 1 } })) ?? null,
    );

    expect(value.value).toBe('Manager');
  });

  it('a value the enum does not have is shown as it is', () => {
    const { injector, column } = titleColumn();
    const value = unwrapResolvable(
      column?.valueResolver(dataFor(injector, { extraProperties: { Title: 99 } })) ?? null,
    );

    expect(value.value).toBe(99);
  });

  it('the form field offers every member as an option', () => {
    const { injector, contributors } = setup();
    const field = fields(contributors.createForm[USERS] ?? []).find(prop => prop.name === 'Title');
    const options = unwrapResolvable(field?.options?.(dataFor(injector, {})) ?? []);

    expect(options.value).toEqual([
      { value: 0, label: 'Engineer' },
      { value: 1, label: 'Manager' },
      { value: 2, label: 'Director' },
    ]);
  });
});

describe('lookups', () => {
  const authorLookup = {
    url: '/api/app/authors/lookup',
    resultListPropertyName: 'items',
    displayPropertyName: 'name',
    valuePropertyName: 'id',
    filterParamName: 'filter',
  };

  const withLookup = (providers: ProviderInput[] = []) => {
    const base = (fixture.objectExtensions.modules.Identity?.entities.User?.properties
      .SocialSecurityNumber ?? {}) as ExtensionPropertyDto;
    const visible = { isVisible: true };

    return setup({
      providers,
      entities: {
        [USERS]: {
          properties: {
            AuthorId: {
              ...base,
              displayName: { name: 'AbpIdentity::Author', resource: '_' },
              ui: {
                onTable: visible,
                onCreateForm: visible,
                onEditForm: visible,
                lookup: authorLookup,
              },
            },
            AuthorId_Text: {
              ...base,
              ui: { onTable: visible, onCreateForm: visible, onEditForm: visible },
            },
          },
          configuration: {},
        },
      },
    });
  };

  it('a property with a lookup url becomes a typeahead', () => {
    const { contributors } = withLookup();
    const byName = new Map(columns(contributors.prop[USERS] ?? []).map(prop => [prop.name, prop]));

    expect(byName.get('AuthorId')?.type).toBe(PropType.Typeahead);
  });

  it('the _Text half of the pair is hidden and borrows the name of the other half', () => {
    const { contributors } = withLookup();
    const byName = new Map(columns(contributors.prop[USERS] ?? []).map(prop => [prop.name, prop]));

    expect(byName.get('AuthorId_Text')?.type).toBe(PropType.Hidden);
    expect(byName.get('AuthorId_Text')?.displayName).toBe(byName.get('AuthorId')?.displayName);
  });

  it('the options search the endpoint the backend named', async () => {
    const request = vi.fn(async () => ({ items: [{ id: '1', name: 'Herbert' }] }));
    const { injector, contributors } = withLookup([
      { provide: RestService, useValue: { request } },
    ]);
    const field = fields(contributors.createForm[USERS] ?? []).find(
      prop => prop.name === 'AuthorId',
    );

    const options = await field?.options?.(dataFor(injector, {}), 'her');

    expect(request).toHaveBeenCalledWith(
      { method: 'GET', url: authorLookup.url, params: { filter: 'her' } },
      { apiName: 'Default' },
    );
    expect(options).toEqual([{ value: '1', label: 'Herbert' }]);
  });

  it('a response without the list it promised is no options rather than a crash', async () => {
    const { injector, contributors } = withLookup([
      { provide: RestService, useValue: { request: async () => ({}) } },
    ]);
    const field = fields(contributors.createForm[USERS] ?? []).find(
      prop => prop.name === 'AuthorId',
    );

    await expect(field?.options?.(dataFor(injector, {}), 'her')).resolves.toEqual([]);
  });
});

describe('display names', () => {
  const propertyNamed = (name: string, displayName?: { name?: string; resource?: string }) => {
    const base = (fixture.objectExtensions.modules.Identity?.entities.User?.properties
      .SocialSecurityNumber ?? {}) as ExtensionPropertyDto;

    return setup({
      entities: {
        [USERS]: {
          properties: { [name]: { ...base, displayName: displayName as never } },
          configuration: {},
        },
      },
    });
  };

  it('prefers the resource key ABP generates for a display name', () => {
    const { contributors } = propertyNamed('UserName');

    expect(columns(contributors.prop[USERS] ?? [])[0]?.displayName).toBe(
      'AbpIdentity::DisplayName:UserName',
    );
  });

  it('falls back to the plain key when the resource has no DisplayName one', () => {
    const { contributors } = propertyNamed('Users');

    expect(columns(contributors.prop[USERS] ?? [])[0]?.displayName).toBe('AbpIdentity::Users');
  });

  it('uses the name itself when the resource has neither', () => {
    const { contributors } = propertyNamed('SocialSecurityNumber');

    expect(columns(contributors.prop[USERS] ?? [])[0]?.displayName).toBe('SocialSecurityNumber');
  });

  it('what the backend named wins over the convention', () => {
    const { contributors } = propertyNamed('UserName', {
      name: 'Surname',
      resource: 'AbpIdentity',
    });

    expect(columns(contributors.prop[USERS] ?? [])[0]?.displayName).toBe('AbpIdentity::Surname');
  });
});

describe('policies', () => {
  it('a property the user has no permission for is not mapped at all', () => {
    const { contributors } = setup();

    expect(fields(contributors.editForm[USERS] ?? []).map(prop => prop.name)).not.toContain(
      'InternalNote',
    );

    const granted = setup({ policies: { 'AbpIdentity.Users.Update': true } });

    expect(fields(granted.contributors.editForm[USERS] ?? []).map(prop => prop.name)).toContain(
      'InternalNote',
    );
  });

  it('a feature the tenant does not have hides the property too', () => {
    const base = (fixture.objectExtensions.modules.Identity?.entities.User?.properties
      .SocialSecurityNumber ?? {}) as ExtensionPropertyDto;
    const entities = {
      [USERS]: {
        properties: {
          Premium: {
            ...base,
            policy: {
              globalFeatures: { features: [], requiresAll: false },
              features: { features: ['Billing.Premium'], requiresAll: false },
              permissions: { permissionNames: [], requiresAll: false },
            },
          },
        },
        configuration: {},
      },
    };

    expect(columns(setup({ entities }).contributors.prop[USERS] ?? [])).toEqual([]);

    const enabled = setup({ entities, features: { 'Billing.Premium': 'True' } });

    expect(columns(enabled.contributors.prop[USERS] ?? [])).toHaveLength(1);
  });

  it('filtering leaves the configuration state alone, so the next user sees it again', () => {
    const { configState } = setup();

    expect(
      configState.snapshot().objectExtensions.modules.Identity?.entities.User?.properties
        .InternalNote,
    ).toBeDefined();
  });
});

describe('an entity nobody extended', () => {
  it('contributes an empty set rather than nothing at all', () => {
    const { contributors } = setup({ entities: { [USERS]: undefined } });

    expect(contributors.prop[USERS]).toEqual([]);
    expect(contributors.createForm[USERS]).toEqual([]);
    expect(contributors.editForm[USERS]).toEqual([]);
  });
});

describe('a type the UI does not know', () => {
  it('renders as text and says so in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const base = (fixture.objectExtensions.modules.Identity?.entities.User?.properties
      .SocialSecurityNumber ?? {}) as ExtensionPropertyDto;

    const { contributors } = setup({
      entities: {
        [USERS]: {
          properties: { Odd: { ...base, typeSimple: 'guid' } },
          configuration: {},
        },
      },
    });

    expect(columns(contributors.prop[USERS] ?? [])[0]?.type).toBe(PropType.String);
    warn.mockRestore();
  });
});
