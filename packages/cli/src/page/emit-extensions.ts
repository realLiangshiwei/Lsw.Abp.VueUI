import { ImportCollector } from '../generator/imports.js';
import { camelCase, kebabCase } from '../generator/names.js';
import type { EntityPage, GeneratedProp } from './entity.js';
import { PROP_TYPES } from './prop-type.js';

const COMPONENTS = '@lsw-abpvue/components';
const CORE = '@lsw-abpvue/core';
const THEME_SHARED = '@lsw-abpvue/theme-shared';

/** `IdentityUser` becomes `IDENTITY_USER`, which is what a constant is called. */
export function constantCase(name: string): string {
  return kebabCase(name).replace(/-/g, '_').toUpperCase();
}

/** The names the generated files agree on. */
export function namesOf(page: EntityPage): {
  key: string;
  token: string;
  entityProps: string;
  formProps: string;
  entityActions: string;
  toolbarActions: string;
  register: string;
} {
  const entity = constantCase(page.entity);

  return {
    key: constantCase(page.plural),
    token: `${constantCase(page.plural)}_PAGE`,
    entityProps: `${entity}_ENTITY_PROPS`,
    formProps: `${entity}_FORM_PROPS`,
    entityActions: `${entity}_ENTITY_ACTIONS`,
    toolbarActions: `${entity}_TOOLBAR_ACTIONS`,
    register: `register${page.plural}Extensions`,
  };
}

/** The enums the page shows, each of them once however many props use it. */
function enumsOf(page: EntityPage): GeneratedProp[] {
  const seen = new Set<string>();

  return [...page.columns, ...page.fields].filter(prop => {
    if (!prop.enumType || seen.has(prop.enumType)) return false;
    seen.add(prop.enumType);

    return true;
  });
}

function enumHelpers(page: EntityPage): string[] {
  const groups = enumsOf(page).map(prop => {
    const type = prop.enumType as string;
    const text = `${camelCase(type)}Text`;
    const values = (prop.enumValues ?? []).join(', ');

    return [
      `const ${text} = (data: PropData<${page.types.record}>, value: unknown): string =>`,
      `  data.getInjected(LocalizationService).t(\`${page.resource}::Enum:${type}.\${value}\`);`,
      '',
      `const ${camelCase(type)}Options = (data: PropData<${page.types.record}>): AbpOption[] =>`,
      `  [${values}].map(value => ({ value, label: ${text}(data, value) }));`,
    ];
  });

  return groups.flatMap((group, index) => (index === 0 ? group : ['', ...group]));
}

/** One entry of `EntityProp.createMany`. */
function columnOf(prop: GeneratedProp): string {
  const lines = [
    `type: ${prop.type},`,
    `name: '${prop.name}',`,
    `displayName: '${prop.displayName}',`,
  ];

  if (prop.type === PROP_TYPES.enum) {
    const text = `${camelCase(prop.enumType as string)}Text`;
    lines.push(`valueResolver: data => ${text}(data, data.record.${prop.name}),`);
  } else {
    // Sorting is what a paged list is for, and ABP's CrudAppService sorts by any
    // property of the DTO. A column of a shape the backend cannot order by is one to
    // take the flag off by hand.
    lines.push('sortable: true,');
  }

  return `  {\n${lines.map(line => `    ${line}`).join('\n')}\n  },`;
}

/** One entry of `FormProp.createMany`. */
function fieldOf(prop: GeneratedProp): string {
  const lines = [
    `type: ${prop.type},`,
    `name: '${prop.name}',`,
    `displayName: '${prop.displayName}',`,
  ];

  if (prop.type === PROP_TYPES.enum) {
    lines.push(`options: ${camelCase(prop.enumType as string)}Options,`);
  }

  if (prop.validators.length > 0) {
    lines.push(`validators: () => [${prop.validators.join(', ')}],`);
  }

  return `  {\n${lines.map(line => `    ${line}`).join('\n')}\n  },`;
}

function actionOf(
  text: string,
  icon: string,
  policy: string | undefined,
  body: string,
  extra: string[] = [],
): string {
  const lines = [
    `text: '${text}',`,
    `icon: '${icon}',`,
    ...(policy ? [`permission: '${policy}',`] : []),
    `action: ${body},`,
    ...extra,
  ];

  return `  {\n${lines.map(line => `    ${line}`).join('\n')}\n  },`;
}

/** `// abpv:begin id` … `// abpv:end id`, which is what a regeneration replaces. */
export function block(id: string, lines: string[]): string {
  return [`// abpv:begin ${id}`, ...lines, `// abpv:end ${id}`].join('\n');
}

const HEADER = [
  '// What this page contributes to the extension system: its columns, its form fields and',
  '// its buttons. This is the file to edit -- a column removed here is a column gone, and a',
  '// third-party package can add its own through the same extension points.',
  '//',
  '// `abpv generate --force` rewrites what is inside the `abpv:begin` markers and leaves',
  '// everything else alone.',
].join('\n');

/**
 * The `<entity>.extensions.ts` of a generated page.
 * @param page What was read off the API definition
 * @param autoImports Whether the application's build imports common APIs
 */
export function emitExtensions(page: EntityPage, autoImports = false): string {
  const names = namesOf(page);
  const record = page.types.record;
  const enums = enumsOf(page);
  const imports = new ImportCollector();

  if (!autoImports) {
    for (const name of ['EntityProp', 'FormProp', 'PropType', 'mergeWithDefaultProps']) {
      imports.addValue(COMPONENTS, name);
    }

    imports.addValue(COMPONENTS, 'useExtensions');
    imports.addValue(COMPONENTS, 'getObjectExtensionEntities');
    imports.addValue(COMPONENTS, 'mapEntitiesToContributors');
    imports.addValue(COMPONENTS, 'mergeWithDefaultProps');
    imports.addValue(CORE, 'defineToken');
    imports.addValue(CORE, 'getCurrentInjector');
  }
  imports.addType(`../proxy/${page.service.directory}`, record);

  const actions = [
    actionOf(
      'AbpUi::Edit',
      'bi bi-pencil',
      page.policies.update,
      `data => data.getInjected(${names.token}).edit(data.record)`,
    ),
    actionOf(
      'AbpUi::Delete',
      'bi bi-trash',
      page.policies.delete,
      `data => data.getInjected(${names.token}).remove(data.record)`,
    ),
  ];

  if (!autoImports) {
    imports.addValue(COMPONENTS, 'EntityAction');
    imports.addValue(COMPONENTS, 'ToolbarAction');
    imports.addValue(COMPONENTS, 'mergeWithDefaultActions');
  }

  if (!autoImports && enums.length > 0) {
    imports.addValue(CORE, 'LocalizationService');
    imports.addType(COMPONENTS, 'PropData');
    imports.addType(THEME_SHARED, 'AbpOption');
  }

  if (!autoImports && page.fields.some(field => field.validators.length > 0)) {
    imports.addValue(THEME_SHARED, 'Validators');
  }

  const toolbar = actionOf(
    `${page.resource}::New${page.entity}`,
    'bi bi-plus',
    page.policies.create,
    `data => data.getInjected(${names.token}).add()`,
  );

  const body = [
    block('imports', [imports.render()]),
    '',
    "/** The page's key in the extension system: a contributor addresses the page by it. */",
    `export const ${names.key} = '${page.componentKey}';`,
    '',
    "/** What the page's own buttons call; the page provides it. */",
    `export const ${names.token} = defineToken<{`,
    '  add(): void;',
    `  edit(record: ${record}): void;`,
    `  remove(record: ${record}): void;`,
    `}>('${page.plural}Page');`,
    '',
    ...(enums.length > 0
      ? [
          block('enums', [
            '/** ABP localizes an enum member under `Enum:{Type}.{value}` of its own resource. */',
            ...enumHelpers(page),
          ]),
          '',
        ]
      : []),
    block('props', [
      `export const ${names.entityProps} = EntityProp.createMany<${record}>([`,
      ...page.columns.map(columnOf),
      ']);',
      '',
      `export const ${names.formProps} = FormProp.createMany<${record}>([`,
      ...page.fields.map(fieldOf),
      ']);',
    ]),
    '',
    block('actions', [
      `export const ${names.entityActions} = EntityAction.createMany<${record}>([`,
      ...actions,
      ']);',
      '',
      `export const ${names.toolbarActions} = ToolbarAction.createMany<readonly ${record}[]>([`,
      toolbar,
      ']);',
    ]),
    '',
    block('register', [
      '/** Puts all of it on the page. The page calls it once, from its `setup`. */',
      `export function ${names.register}(): void {`,
      '  const injector = getCurrentInjector();',
      '  if (!injector) return;',
      '',
      '  const extensions = useExtensions();',
      '',
      '  // Whatever the backend declares in `ObjectExtensions` for this entity becomes a',
      '  // column and a form field here, with no regeneration: it arrives in the',
      '  // application configuration at runtime.',
      `  const entities = getObjectExtensionEntities(injector, '${page.extensionModule}');`,
      `  const fromBackend = mapEntitiesToContributors<${record}>(`,
      '    injector,',
      `    { [${names.key}]: entities.${page.extensionEntity} },`,
      `    '${page.resource}',`,
      '  );',
      '',
      `  mergeWithDefaultProps(`,
      '    extensions.entityProps,',
      `    { [${names.key}]: ${names.entityProps} },`,
      '    fromBackend.prop,',
      '  );',
      `  mergeWithDefaultProps(`,
      '    extensions.createFormProps,',
      `    { [${names.key}]: ${names.formProps} },`,
      '    fromBackend.createForm,',
      '  );',
      `  mergeWithDefaultProps(`,
      '    extensions.editFormProps,',
      `    { [${names.key}]: ${names.formProps} },`,
      '    fromBackend.editForm,',
      '  );',
      `  mergeWithDefaultActions(extensions.entityActions, { [${names.key}]: ${names.entityActions} });`,
      '  mergeWithDefaultActions(extensions.toolbarActions, {',
      `    [${names.key}]: ${names.toolbarActions},`,
      '  });',
      '}',
    ]),
  ];

  return `${HEADER}\n\n${body.join('\n')}\n`;
}
