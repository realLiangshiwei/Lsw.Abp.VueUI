import type {
  ActionDefinition,
  ApiDefinition,
  ControllerDefinition,
  PropertyDefinition,
  TypeDefinition,
} from '../api-definition/models.js';
import { parseClrType, shortName, typePoolKey } from '../generator/clr-type.js';
import { validatorsForProperty } from '../generator/emit-validators.js';
import { camelCase, kebabCase, namespaceToDirectory, pascalCase } from '../generator/names.js';
import type { GenerationReport } from '../generator/report.js';
import type { TypeRegistry } from '../generator/type-registry.js';
import { bare, propTypeOf, PROP_TYPES, type PropTypeExpression } from './prop-type.js';

/** What ABP puts on every DTO and no page shows as a column of its own. */
const NOT_A_FIELD = new Set([
  'id',
  'extraProperties',
  'concurrencyStamp',
  'creationTime',
  'creatorId',
  'lastModificationTime',
  'lastModifierId',
  'isDeleted',
  'deleterId',
  'deletionTime',
  'tenantId',
]);

/** The paged and unpaged result envelopes, which is where the record type is. */
const RESULT_TYPES = new Set([
  'Volo.Abp.Application.Dtos.PagedResultDto',
  'Volo.Abp.Application.Dtos.ListResultDto',
]);

export class EntityNotFoundError extends Error {
  constructor(entity: string, available: string[]) {
    super(
      `The backend does not describe an entity called "${entity}". ` +
        `Its controllers are: ${available.join(', ')}. ` +
        'Pass one of those, or --module to look in another module.',
    );
    this.name = 'EntityNotFoundError';
  }
}

export class NotACrudControllerError extends Error {
  constructor(entity: string, missing: string) {
    super(
      `The "${entity}" controller has no ${missing}, so there is no CRUD page to generate ` +
        'from it. A page for a service of another shape is one to write by hand; the ' +
        'generated pages of this project are a good starting point.',
    );
    this.name = 'NotACrudControllerError';
  }
}

/** One column or one form field. */
export interface GeneratedProp {
  /** The name the record carries, which is what a control binds to. */
  name: string;
  type: PropTypeExpression;
  /** Localization key, `BookStore::Name`. */
  displayName: string;
  /** The rules the backend's own data annotations stand for. */
  validators: string[];
  /** The enum's CLR name, for the member texts; only on an enum prop. */
  enumType?: string | undefined;
  /** The values the enum declares, in the order the backend lists them. */
  enumValues?: number[] | undefined;
  /** What the proxy called the enum, which is not always its CLR short name. */
  enumIdentifier?: string | undefined;
}

export interface EntityPolicies {
  list?: string | undefined;
  create?: string | undefined;
  update?: string | undefined;
  delete?: string | undefined;
}

/** Everything the two generated files and the route need to say. */
export interface EntityPage {
  /** The api-definition module the controller came from, which is what the proxy is
   * generated per. */
  module: string;
  /** `Book` */
  entity: string;
  /** `Books` */
  plural: string;
  /** `books`, which names both files. */
  fileBase: string;
  /** The extension system's component key, `BookStore.BooksComponent`. */
  componentKey: string;
  /** The localization resource, `BookStore`. */
  resource: string;
  /**
   * How the backend files this entity's object extensions: the module
   * `objectExtensions.modules` is keyed by, and the entity under it. ABP's own modules
   * use `Identity` and `User`; an application picks its own module name, usually the
   * project's, and names the entity after the class.
   */
  extensionModule: string;
  extensionEntity: string;
  route: string;
  /** Localization key of the menu entry and the page title. */
  menuKey: string;
  icon: string | undefined;
  /** The proxy's service: its name and the directory the proxy put it in. */
  service: { name: string; directory: string };
  /** The generated types, as the proxy exports them. */
  types: { record: string; create: string; update: string };
  columns: GeneratedProp[];
  fields: GeneratedProp[];
  policies: EntityPolicies;
  /** Whether the list endpoint takes a `filter`, which puts a search box on the page. */
  filter: boolean;
  /**
   * Whether there is a single-record endpoint. Without one the edit dialog opens on the
   * row the table already has, which is missing whatever the list DTO leaves out.
   */
  reload: boolean;
  /** The property the deletion question names. */
  nameProperty: string | undefined;
  /**
   * Whether the record carries a concurrency stamp. ABP refuses an update that does not
   * carry back the stamp it handed out, and the stamp is not a form field.
   */
  concurrencyStamp: boolean;
}

/** ABP's own name for the controller: `BookAppService` is the `Book` controller. */
function controllerNames(controller: ControllerDefinition): string[] {
  return [controller.controllerName, controller.controllerGroupName, shortName(controller.type)]
    .filter((name): name is string => Boolean(name))
    .map(name => name.replace(/(AppService|Controller)$/, ''));
}

interface FoundController {
  module: string;
  controller: ControllerDefinition;
}

/**
 * The controller an entity name means. Matching is case-insensitive and ignores the
 * plural, because `abpv generate Books` is the same request as `abpv generate Book`.
 *
 * @param definition The API definition
 * @param entity What the command was given
 * @param moduleName Restricts the search to one module
 */
export function findController(
  definition: ApiDefinition,
  entity: string,
  moduleName?: string | undefined,
): FoundController {
  const modules = Object.entries(definition.modules).filter(
    ([name]) => !moduleName || name === moduleName,
  );

  const wanted = new Set(
    [entity, pluralize(entity), singularize(entity)].map(name => name.toLowerCase()),
  );
  const available: string[] = [];

  for (const [module, definitionOfModule] of modules) {
    for (const controller of Object.values(definitionOfModule.controllers)) {
      const names = controllerNames(controller);
      available.push(names[0] as string);

      if (names.some(name => wanted.has(name.toLowerCase()))) return { module, controller };
    }
  }

  throw new EntityNotFoundError(entity, [...new Set(available)].sort());
}

/** Whether the URL of an action carries a route parameter, which is the record's id. */
function takesId(action: ActionDefinition): boolean {
  return /\{[^}]+\}/.test(action.url);
}

export interface EntityActions {
  getList: ActionDefinition;
  get: ActionDefinition | undefined;
  create: ActionDefinition | undefined;
  update: ActionDefinition | undefined;
  delete: ActionDefinition | undefined;
}

/**
 * The five CRUD actions, by their HTTP shape rather than by their names: a service that
 * renames `GetListAsync` is still the one action that lists.
 * @param controller The controller the entity was found in
 * @param entity What the command was given, for the error message
 */
export function readActions(controller: ControllerDefinition, entity: string): EntityActions {
  const actions = Object.values(controller.actions);
  const method = (name: string): ActionDefinition[] =>
    actions.filter(action => action.httpMethod.toUpperCase() === name);

  const getList = method('GET').find(action => {
    const returned = parseClrType(action.returnValue.type);

    return !takesId(action) && returned.kind === 'name' && RESULT_TYPES.has(returned.name);
  });

  if (!getList) throw new NotACrudControllerError(entity, 'endpoint that lists records');

  const actionsOf = {
    getList,
    get: method('GET').find(action => takesId(action) && action !== getList),
    // The POST that creates is the one on the list's own URL, as `CrudAppService`
    // lays it out. A POST somewhere else under the controller -- an import, a bulk
    // action -- is not it, and taking the first one found would make it one.
    create:
      method('POST').find(action => action.url === getList.url) ??
      method('POST').find(
        action => !takesId(action) && action.url.startsWith(getList.url) === false,
      ),
    update: method('PUT').find(takesId),
    delete: method('DELETE').find(takesId),
  };

  // The page calls all three, so a controller missing one would produce a page that
  // does not compile. Saying which ones are missing is more use than that.
  const missing = (['create', 'update', 'delete'] as const).filter(name => !actionsOf[name]);

  if (missing.length > 0) {
    throw new NotACrudControllerError(
      entity,
      `endpoint that ${missing.map(name => `${name}s`).join(', no endpoint that ')}`,
    );
  }

  return actionsOf;
}

/** The type of the records a list endpoint answers with. */
function recordTypeOf(action: ActionDefinition): string | undefined {
  const parsed = parseClrType(action.returnValue.type);

  return parsed.kind === 'name' ? parsed.args[0] && typePoolKey(parsed.args[0]) : undefined;
}

/** The type of the body an action takes, which is the one a form fills in. */
function bodyTypeOf(action: ActionDefinition | undefined): string | undefined {
  const parameter = action?.parameters.find(bound => bound.bindingSourceId === 'Body');
  if (!parameter) return undefined;

  const parsed = parseClrType(parameter.type);

  return parsed.kind === 'name' ? typePoolKey(parsed) : undefined;
}

/**
 * A type's own properties and the ones it inherits. ABP puts the interesting half of a
 * create DTO on a shared base -- `TenantCreateOrUpdateDtoBase` -- so a page built from
 * the declared properties alone would have one field where the form has three.
 */
function propertiesOf(types: Record<string, TypeDefinition>, key: string): PropertyDefinition[] {
  const definition = types[key];
  if (!definition) return [];

  const inherited = definition.baseType
    ? propertiesOf(types, typePoolKey(parseClrType(definition.baseType)))
    : [];

  return [...inherited, ...(definition.properties ?? [])];
}

/** The enum a property is of, when the type pool has it. */
function enumOf(
  types: Record<string, TypeDefinition>,
  property: PropertyDefinition,
): TypeDefinition | undefined {
  const definition = types[typePoolKey(parseClrType(property.type))];

  return definition?.isEnum ? definition : undefined;
}

function propsOf(
  registry: TypeRegistry,
  types: Record<string, TypeDefinition>,
  typeKey: string,
  resource: string,
  report: GenerationReport,
): GeneratedProp[] {
  const props: GeneratedProp[] = [];

  for (const property of propertiesOf(types, typeKey)) {
    const name = property.jsonName ?? camelCase(property.name);
    if (NOT_A_FIELD.has(name)) continue;

    const path = `${shortName(typeKey)}.${property.name}`;
    const type = propTypeOf(property, report, path);
    if (!type) continue;

    const enumeration = type === PROP_TYPES.enum ? enumOf(types, property) : undefined;

    if (type === PROP_TYPES.enum && !enumeration) {
      report.add('skipped', `${path} is an enum the type pool does not describe; left out.`);
      continue;
    }

    props.push({
      name,
      type,
      displayName: `${resource}::${property.name}`,
      validators: validatorsForProperty(property, report),
      ...(enumeration
        ? {
            enumType: shortName(bare(property.type)),
            enumValues: enumeration.enumValues ?? [],
            enumIdentifier: registry.find(parseClrType(property.type))?.identifier,
          }
        : {}),
    });
  }

  return props;
}

/**
 * Plural of an English noun, for the three rules that cover what entities are called.
 * An entity whose plural is irregular is what `--route` and `--menu` are for.
 * @param word The entity name
 */
export function pluralize(word: string): string {
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;

  return `${word}s`;
}

/** What the proxy exported the type as, which a rename may have made longer. */
function identifierOf(registry: TypeRegistry, key: string): string {
  return registry.get(key)?.identifier ?? shortName(key);
}

/**
 * Singular of an English noun, so `abpv generate Books` finds the `Book` controller.
 * @param word What the command was given
 */
export function singularize(word: string): string {
  if (/ies$/i.test(word)) return `${word.slice(0, -3)}y`;
  if (/(s|x|z|ch|sh)es$/i.test(word)) return word.slice(0, -2);
  if (/[^s]s$/i.test(word)) return word.slice(0, -1);

  return word;
}

/** The permission an action requires, when the backend puts it where we can see it. */
function policyOf(action: ActionDefinition | undefined): string | undefined {
  return (
    action?.authorizeDatas
      ?.map(data => data.policy)
      .filter(Boolean)
      .at(-1) ?? undefined
  );
}

export interface EntityPageOptions {
  definition: ApiDefinition;
  /** The proxy's own registry, so the page imports the names the proxy exported. */
  registry: TypeRegistry;
  /** The service names the proxy generation settled on, keyed by controller type. */
  serviceNames: ReadonlyMap<string, string>;
  entity: string;
  module?: string | undefined;
  /** The localization resource of the texts; the project's own by default. */
  resource?: string | undefined;
  /**
   * Where the backend files this entity's object extensions, as `Module` or
   * `Module.Entity`. The resource name and the entity name by default.
   */
  extensionModule?: string | undefined;
  route?: string | undefined;
  menu?: string | undefined;
  icon?: string | undefined;
  /** Overrides what the actions say, for a backend that authorizes elsewhere. */
  policy?: string | undefined;
  report: GenerationReport;
}

/**
 * What a page for one entity looks like, read off the API definition.
 * @param options The entity and whatever the command line said about it
 */
export function readEntityPage(options: EntityPageOptions): EntityPage {
  const { definition, report } = options;
  const { module, controller } = findController(definition, options.entity, options.module);
  const actions = readActions(controller, options.entity);

  const recordType = recordTypeOf(actions.getList);
  if (!recordType) throw new NotACrudControllerError(options.entity, 'record type it lists');

  const registry = options.registry;
  const entity = shortName(recordType).replace(/Dto$/, '');
  const plural = pluralize(entity);
  const resource = options.resource ?? entity;
  const types = definition.types;

  const createType = bodyTypeOf(actions.create) ?? recordType;
  const updateType = bodyTypeOf(actions.update) ?? createType;
  const columns = propsOf(registry, types, recordType, resource, report);
  const fields = propsOf(registry, types, createType, resource, report);

  if (columns.length === 0) {
    report.add(
      'skipped',
      `${shortName(recordType)} has no property a column can show, so the table has only its ` +
        'row buttons. Add the columns by hand in the extensions file.',
    );
  }
  // ABP reports a bound query parameter under the CLR property's own name, `Filter`.
  const listInput = actions.getList.parameters.some(
    parameter => (parameter.jsonName ?? parameter.name).toLowerCase() === 'filter',
  );

  const policies: EntityPolicies = options.policy
    ? {
        list: options.policy,
        create: `${options.policy}.Create`,
        update: `${options.policy}.Update`,
        delete: `${options.policy}.Delete`,
      }
    : {
        list: policyOf(actions.getList),
        create: policyOf(actions.create),
        update: policyOf(actions.update),
        delete: policyOf(actions.delete),
      };

  return {
    module,
    entity,
    plural,
    fileBase: kebabCase(plural),
    componentKey: `${pascalCase(resource)}.${plural}Component`,
    resource,
    extensionModule: options.extensionModule?.split('.')[0] ?? resource,
    extensionEntity: options.extensionModule?.split('.')[1] ?? entity,
    route: options.route ?? `/${kebabCase(plural)}`,
    menuKey: options.menu ?? `${resource}::Menu:${plural}`,
    icon: options.icon,
    service: {
      name:
        options.serviceNames.get(controller.type) ??
        `${controller.controllerName ?? entity}Service`,
      directory: namespaceToDirectory(registry.get(recordType)?.namespace ?? ''),
    },
    types: {
      record: identifierOf(registry, recordType),
      create: identifierOf(registry, createType),
      update: identifierOf(registry, updateType),
    },
    columns,
    fields,
    policies,
    filter: listInput,
    reload: Boolean(actions.get),
    nameProperty: columns.find(column => column.name === 'name')?.name ?? columns[0]?.name,
    concurrencyStamp: propertiesOf(types, recordType).some(
      property => (property.jsonName ?? camelCase(property.name)) === 'concurrencyStamp',
    ),
  };
}
