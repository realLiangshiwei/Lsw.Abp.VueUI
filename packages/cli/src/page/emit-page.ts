import { ImportCollector } from '../generator/imports.js';
import { camelCase } from '../generator/names.js';
import { controlOf, defaultValue, emitField, literal } from './emit-fields.js';
import type { EntityPage, GeneratedProp } from './entity.js';
import { PROP_TYPES } from './prop-type.js';

const CORE = '@lsw-abpvue/core';
const COMPONENTS = '@lsw-abpvue/components';
const THEME = '@lsw-abpvue/theme-shared';

function enumsOf(page: EntityPage): GeneratedProp[] {
  const seen = new Set<string>();
  return page.fields.filter(prop => {
    if (!prop.enumType || seen.has(prop.enumType)) return false;
    seen.add(prop.enumType);
    return true;
  });
}

function permissionBlock(policy: string | undefined, lines: string[], indent: string): string[] {
  return policy
    ? [
        `${indent}<AbpPermission policy="${policy}">`,
        ...lines.map(line => `  ${line}`),
        `${indent}</AbpPermission>`,
      ]
    : lines;
}

function guard(policy: string | undefined): string {
  return `  if (isBusy.value${policy ? ` || !permission.isGranted(${literal(policy)})` : ''}) return;`;
}

/**
 * Emits an application-owned CRUD page with explicit controls and commands.
 * @param page The entity read from the API definition
 * @param autoImports Whether the application's build imports common APIs
 * @param proxy The service import path relative to the page
 */
export function emitPage(
  page: EntityPage,
  autoImports = false,
  proxy = `../proxy/${page.service.directory}`,
): string {
  const record = page.types.record;
  const service = camelCase(page.service.name);
  const methods = {
    getList: 'getList',
    get: 'get',
    create: 'create',
    update: 'update',
    delete: 'delete',
    ...page.service.methods,
  };
  const enums = enumsOf(page);
  const hasPolicies = [page.policies.create, page.policies.update, page.policies.delete].some(
    Boolean,
  );
  const hasDates = page.columns.some(
    prop => prop.type === PROP_TYPES.date || prop.type === PROP_TYPES.dateTime,
  );
  const hasRecordFields = page.fields.some(field => field.recordProperty !== false);
  const imports = new ImportCollector();
  imports.addValue(proxy, page.service.name);
  for (const type of new Set(Object.values(page.types))) imports.addType(proxy, type);

  if (!autoImports) {
    for (const name of ['computed', 'ref', 'shallowRef', 'watch']) imports.addValue('vue', name);
    for (const name of ['inject as injectAbp', 'useListService', 'useLocalization'])
      imports.addValue(CORE, name);
    if (hasPolicies) {
      imports.addValue(CORE, 'usePermission');
      imports.addValue(CORE, 'AbpPermission');
    }
    for (const name of ['AbpDataTable', 'AbpGridActions', 'AbpPage'])
      imports.addValue(COMPONENTS, name);
    imports.addType(COMPONENTS, 'AbpTableColumn');
    imports.addType(COMPONENTS, 'RowAction');
    for (const name of [
      'AbpButton',
      'AbpModal',
      'AbpPagination',
      'useAbpForm',
      'useConfirmation',
      'ConfirmationStatus',
      'useToaster',
      'useServerValidation',
      ...(page.fields.length ? ['AbpFormField', 'useValidationMessages'] : []),
      ...page.fields.map(controlOf),
      ...(page.filter ? ['AbpInput'] : []),
      ...(page.fields.some(field => field.validators.length) ? ['Validators'] : []),
    ])
      imports.addValue(THEME, name);
    if (enums.length) imports.addType(THEME, 'AbpOption');
  }

  const createName = `create${page.entity}`;
  const editName = `edit${page.entity}`;
  const deleteName = `delete${page.entity}`;
  const rowActions = [
    { policy: page.policies.update, text: 'AbpUi::Edit', method: editName },
    { policy: page.policies.delete, text: 'AbpUi::Delete', method: deleteName },
  ].map(action => {
    const entry = `{ text: ${literal(action.text)}, action: ${action.method} }`;
    return action.policy
      ? `  ...(permission.isGranted(${literal(action.policy)}) ? [${entry}] : []),`
      : `  ${entry},`;
  });
  const columns = page.columns.map(prop => {
    let value = '';
    if (prop.type === PROP_TYPES.enum)
      value = `, value: row => t(\`${page.resource}::Enum:${prop.enumType}.\${row.${prop.name}}\`)`;
    if (prop.type === PROP_TYPES.boolean)
      value = `, value: row => t(row.${prop.name} ? 'AbpUi::Yes' : 'AbpUi::No')`;
    if (prop.type === PROP_TYPES.date || prop.type === PROP_TYPES.dateTime)
      value = `, value: row => formatDate(row.${prop.name})`;
    return `  { id: ${literal(prop.name)}, header: t(${literal(prop.displayName)}), sortable: true${value} },`;
  });

  const template = [
    '<template>',
    `  <AbpPage title="${page.menuKey}">`,
    '    <template #toolbar>',
    ...permissionBlock(
      page.policies.create,
      [
        `      <AbpButton :disabled="isBusy" @click="${createName}">`,
        '        <i class="bi bi-plus me-1" aria-hidden="true" />',
        `        {{ t(${literal(`${page.resource}::New${page.entity}`)}) }}`,
        '      </AbpButton>',
      ],
      '      ',
    ),
    '    </template>',
    '',
    '    <div class="card">',
    ...(page.filter
      ? [
          '      <div class="card-body border-bottom">',
          '        <AbpInput v-model="list.filter.value" type="search" :placeholder="t(\'AbpUi::PagerSearch\')" :aria-label="t(\'AbpUi::PagerSearch\')" />',
          '      </div>',
        ]
      : []),
    '      <AbpDataTable',
    '        v-model:sort-key="list.sortKey.value"',
    '        v-model:sort-order="list.sortOrder.value"',
    '        :columns="columns"',
    '        :data="items"',
    '        :loading="list.requestStatus.value === \'loading\'"',
    `        :caption="t(${literal(page.menuKey)})"`,
    '        record-key="id"',
    '      >',
    '        <template #cell-__actions="{ row }">',
    '          <AbpGridActions :record="row" :actions="rowActions" :disabled="isBusy" />',
    '        </template>',
    '      </AbpDataTable>',
    '      <div class="card-footer d-flex flex-wrap align-items-center justify-content-between gap-3">',
    '        <p class="text-muted small mb-0">{{ pageInfo }}</p>',
    '        <AbpPagination v-model:page="list.page.value" v-model:page-size="list.maxResultCount.value" :total="list.totalCount.value" :disabled="list.requestStatus.value === \'loading\'" show-size-selector />',
    '      </div>',
    '    </div>',
    '',
    '    <AbpModal v-model:visible="isModalOpen" :dirty="form.dirty" :busy="isBusy">',
    '      <template #header>',
    `        <h2 class="h5 mb-0">{{ t(selected ? 'AbpUi::Edit' : ${literal(`${page.resource}::New${page.entity}`)}) }}</h2>`,
    '      </template>',
    `      <form id="${page.fileBase}-form" class="d-grid gap-3" @submit.prevent="save">`,
    ...page.fields.flatMap(emitField),
    '        <div v-for="message in form.unmatchedServerErrors" :key="message" class="alert alert-danger" role="alert">{{ message }}</div>',
    '      </form>',
    '      <template #footer="{ close }">',
    '        <AbpButton variant="secondary" outline :disabled="isBusy" @click="close">{{ t(\'AbpUi::Cancel\') }}</AbpButton>',
    `        <AbpButton type="submit" form="${page.fileBase}-form" :loading="isBusy">{{ t('AbpUi::Save') }}</AbpButton>`,
    '      </template>',
    '    </AbpModal>',
    '  </AbpPage>',
    '</template>',
  ];

  const script = [
    '<script setup lang="ts">',
    imports.render(),
    '',
    `const ${service} = injectAbp(${page.service.name});`,
    hasDates ? 'const { t, currentLang } = useLocalization();' : 'const { t } = useLocalization();',
    ...(hasPolicies ? ['const permission = usePermission();'] : []),
    'const confirmation = useConfirmation();',
    'const toaster = useToaster();',
    ...(page.fields.length ? ['const validationMessages = useValidationMessages();'] : []),
    '',
    `const list = useListService({ persistKey: ${literal(page.componentKey)} });`,
    `const { items } = list.hookToQuery(query => ${service}.${methods.getList}(query));`,
    'watch([list.sortKey, list.sortOrder, list.maxResultCount], () => { list.page.value = 0; });',
    'const pageInfo = computed(() => {',
    '  const first = list.page.value * list.maxResultCount.value;',
    "  return t('AbpUi::PagerInfo{0}{1}{2}', items.value.length ? first + 1 : 0, Math.min(first + items.value.length, list.totalCount.value), list.totalCount.value);",
    '});',
    '',
    'const isModalOpen = ref(false);',
    'const isBusy = ref(false);',
    `const selected = shallowRef<${record}>();`,
    'const form = useAbpForm({',
    ...page.fields.map(
      prop =>
        `  ${prop.name}: { value: ${defaultValue(prop)}, validators: [${prop.validators.join(', ')}] },`,
    ),
    '});',
    'useServerValidation(form);',
    '',
    ...(page.fields.length
      ? [
          'function errorsOf(name: keyof typeof form.controls): string[] {',
          '  const field = form.controls[name];',
          '  return field.touched ? validationMessages(field.errors) : [];',
          '}',
          '',
        ]
      : []),
    ...enums.flatMap(prop => [
      `const ${camelCase(prop.enumType ?? prop.name)}Options = computed<AbpOption[]>(() =>`,
      `  [${(prop.enumValues ?? []).join(', ')}].map(value => ({ value, label: t(\`${page.resource}::Enum:${prop.enumType}.\${value}\`) })),`,
      ');',
      '',
    ]),
    ...(page.columns.some(
      prop => prop.type === PROP_TYPES.date || prop.type === PROP_TYPES.dateTime,
    )
      ? [
          'function formatDate(value: string | null | undefined): string {',
          "  if (!value) return '';",
          '  const date = new Date(value);',
          '  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(currentLang.value).format(date);',
          '}',
          '',
        ]
      : []),
    `const rowActions = computed<RowAction<${record}>[]>(() => [`,
    ...rowActions,
    ']);',
    `const columns = computed<AbpTableColumn<${record}>[]>(() => [`,
    "  ...(rowActions.value.length ? [{ id: '__actions', header: t('AbpUi::Actions') }] : []),",
    ...columns,
    ']);',
    '',
    `function buildForm(${hasRecordFields ? `record?: ${record}` : ''}): void {`,
    '  form.reset({',
    ...page.fields.map(
      prop =>
        `    ${prop.name}: ${prop.recordProperty === false ? defaultValue(prop, false) : `record?.${prop.name} ?? ${defaultValue(prop, false)}`},`,
    ),
    '  });',
    '}',
    '',
    `function ${createName}(): void {`,
    guard(page.policies.create),
    '  selected.value = undefined;',
    '  buildForm();',
    '  isModalOpen.value = true;',
    '}',
    '',
    `async function ${editName}(record: ${record}): Promise<void> {`,
    guard(page.policies.update),
    '  isBusy.value = true;',
    '  try {',
    page.reload
      ? `    selected.value = await ${service}.${methods.get}(record.id ?? '');`
      : '    selected.value = record;',
    hasRecordFields ? '    buildForm(selected.value);' : '    buildForm();',
    '    isModalOpen.value = true;',
    '  } catch {',
    '    // The HTTP error handler has already reported the failed request.',
    '  } finally {',
    '    isBusy.value = false;',
    '  }',
    '}',
    '',
    'async function save(): Promise<void> {',
    '  if (isBusy.value || !isModalOpen.value || !form.validate()) return;',
    ...(page.policies.create || page.policies.update
      ? [
          `  if (!permission.isGranted(selected.value ? ${literal(page.policies.update ?? '')} : ${literal(page.policies.create ?? '')})) return;`,
        ]
      : []),
    '  isBusy.value = true;',
    '  const body = {',
    '    ...selected.value,',
    '    ...form.value,',
    ...(page.concurrencyStamp ? ['    concurrencyStamp: selected.value?.concurrencyStamp,'] : []),
    '  };',
    '  try {',
    '    if (selected.value?.id) {',
    `      await ${service}.${methods.update}(selected.value.id, body as ${page.types.update});`,
    '    } else {',
    `      await ${service}.${methods.create}(body as ${page.types.create});`,
    '    }',
    '    isModalOpen.value = false;',
    "    toaster.success('AbpUi::SavedSuccessfully');",
    '    list.get();',
    '  } catch {',
    '    // Keep the form open; HTTP and validation handlers report the failure.',
    '  } finally {',
    '    isBusy.value = false;',
    '  }',
    '}',
    '',
    `async function ${deleteName}(record: ${record}): Promise<void> {`,
    guard(page.policies.delete),
    `  const answer = await confirmation.warn(${literal(`${page.resource}::${page.entity}DeletionConfirmationMessage`)}, 'AbpUi::AreYouSure', {`,
    `    messageLocalizationParams: [${page.nameProperty ? `String(record.${page.nameProperty} ?? '')` : "''"}],`,
    '  });',
    '  if (answer !== ConfirmationStatus.confirm) return;',
    '  isBusy.value = true;',
    '  try {',
    `    await ${service}.${methods.delete}(record.id ?? '');`,
    "    toaster.success('AbpUi::DeletedSuccessfully');",
    '    list.get();',
    '  } catch {',
    '    // The HTTP error handler has already reported the failed request.',
    '  } finally {',
    '    isBusy.value = false;',
    '  }',
    '}',
    '</script>',
  ];
  return `${template.join('\n')}\n\n${script.join('\n')}\n`;
}
