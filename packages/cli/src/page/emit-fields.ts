import { camelCase } from '../generator/names.js';
import type { GeneratedProp } from './entity.js';
import { PROP_TYPES } from './prop-type.js';

export function literal(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n')}'`;
}

export function defaultValue(prop: GeneratedProp, assertion = true): string {
  if (prop.type === PROP_TYPES.boolean) return 'false';
  if (prop.type === PROP_TYPES.number || prop.type === PROP_TYPES.enum) {
    return assertion ? 'null as number | null' : 'null';
  }
  if (
    prop.type === PROP_TYPES.date ||
    prop.type === PROP_TYPES.time ||
    prop.type === PROP_TYPES.dateTime
  ) {
    return assertion ? 'null as string | null' : 'null';
  }
  return "''";
}

export function controlOf(prop: GeneratedProp): string {
  if (prop.type === PROP_TYPES.enum) return 'AbpSelect';
  if (prop.type === PROP_TYPES.boolean) return 'AbpToggle';
  if (
    prop.type === PROP_TYPES.date ||
    prop.type === PROP_TYPES.time ||
    prop.type === PROP_TYPES.dateTime
  ) {
    return 'AbpDatePicker';
  }
  return 'AbpInput';
}

export function emitField(prop: GeneratedProp): string[] {
  const control = `form.controls.${prop.name}`;
  const component = controlOf(prop);
  const update =
    prop.type === PROP_TYPES.enum
      ? `${control}.value = typeof $event === 'number' ? $event : null`
      : prop.type === PROP_TYPES.boolean
        ? `${control}.value = Boolean($event)`
        : prop.type === PROP_TYPES.number
          ? `${control}.value = $event === null || $event === '' ? null : Number($event)`
          : component === 'AbpDatePicker'
            ? `${control}.value = $event`
            : `${control}.value = String($event ?? '')`;
  const types: Partial<Record<GeneratedProp['type'], string>> = {
    [PROP_TYPES.number]: 'number',
    [PROP_TYPES.text]: 'textarea',
    [PROP_TYPES.email]: 'email',
    [PROP_TYPES.time]: 'time',
    [PROP_TYPES.dateTime]: 'datetime',
  };
  const type = types[prop.type];

  return [
    '        <AbpFormField',
    '          v-slot="{ id, describedBy, invalid }"',
    `          :label="t(${literal(prop.displayName)})"`,
    `          :errors="errorsOf('${prop.name}')"`,
    ...(prop.validators.includes('Validators.required()') ? ['          required'] : []),
    '        >',
    `          <${component}`,
    '            :id="id"',
    `            :model-value="${control}.value"`,
    '            :aria-describedby="describedBy"',
    '            :invalid="invalid"',
    '            :disabled="isBusy"',
    ...(type ? [`            type="${type}"`] : []),
    ...(prop.type === PROP_TYPES.number ? ['            :step="0.01"'] : []),
    ...(prop.type === PROP_TYPES.boolean ? ['            variant="checkbox"'] : []),
    ...(prop.type === PROP_TYPES.enum
      ? [`            :options="${camelCase(prop.enumType ?? prop.name)}Options"`]
      : []),
    `            @update:model-value="${update}"`,
    `            @blur="${control}.markAsTouched()"`,
    '          />',
    '        </AbpFormField>',
  ];
}
