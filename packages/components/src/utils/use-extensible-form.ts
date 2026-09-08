import { type AbpFormGroup, useAbpForm } from '@lsw-abpvue/theme-shared';
import { EXTRA_PROPERTIES_KEY } from '../constants/extra-properties.js';
import { PropType } from '../enums/prop-type.js';
import type { FormProp } from '../models/form-props.js';
import type { PropData } from '../models/prop-data.js';
import { ExtensionsService } from '../services/extensions.service.js';
import { EXTENSIONS_IDENTIFIER } from '../tokens/extensions.token.js';
import { extraPropertiesOf, readValue } from './record.js';
import { useGetInjected } from './use-action-list.js';

/** What a control of this type starts at when nothing else says otherwise. */
function emptyValueOf(type: PropType): unknown {
  if (type === PropType.Boolean) return false;
  if (type === PropType.MultiSelect) return [];
  if (type === PropType.Number) return null;

  return '';
}

function initialValueOf<R>(prop: FormProp<R>, record: R | undefined): unknown {
  const isExtra = prop.isExtra || prop.name in extraPropertiesOf(record);
  const stored = record === undefined ? undefined : readValue(record, prop.name, isExtra);

  if (stored !== undefined && stored !== null) return stored;
  if (prop.defaultValue !== undefined) return prop.defaultValue;

  return emptyValueOf(prop.type);
}

export interface ExtensibleForm<R = unknown> {
  /** The controls, one per field: `form.controls.name.value` binds with `v-model`. */
  readonly form: AbpFormGroup;
  /** The fields as the contributors left them, in order. */
  readonly props: readonly FormProp<R>[];
  /** Whether the edit form was used rather than the create one. */
  readonly isEdit: boolean;
  /**
   * The values in the shape an ABP endpoint takes them: what the backend's object
   * extensions added goes back under `extraProperties`.
   */
  toRequestBody(): Record<string, unknown>;
}

/**
 * Builds the form of the current page from its extension point: the create fields when
 * there is no record, the edit fields when there is one. The page owns the form -- it is
 * what submits, validates and takes the server's errors -- and `AbpExtensibleForm`
 * renders it.
 *
 * @param record The record being edited; leave it out to create one
 */
export function useExtensibleForm<R = unknown>(record?: R | undefined): ExtensibleForm<R> {
  const { injector, getInjected } = useGetInjected();
  const extensions = injector.get(ExtensionsService);
  const identifier = injector.get(EXTENSIONS_IDENTIFIER);

  const isEdit = record !== undefined && Object.keys(record as object).length > 0;
  const factory = isEdit ? extensions.editFormProps : extensions.createFormProps;
  const props = factory.get<R>(identifier).props.toArray();

  const data: PropData<R> = { record: (record ?? {}) as R, getInjected };
  const definition: Record<
    string,
    { value: unknown; validators: never; disabled: boolean; readonly: boolean }
  > = {};

  for (const prop of props) {
    definition[prop.name] = {
      value: initialValueOf(prop, record),
      validators: prop.validators(data) as never,
      disabled: prop.disabled(data),
      readonly: prop.readonly(data),
    };
  }

  const form = useAbpForm(definition as never) as AbpFormGroup;

  return {
    form,
    props,
    isEdit,

    toRequestBody: () => {
      const body: Record<string, unknown> = {};
      const extras: Record<string, unknown> = {};

      for (const prop of props) {
        const value = form.get(prop.name)?.value;
        if (prop.isExtra) extras[prop.name] = value;
        else body[prop.name] = value;
      }

      return Object.keys(extras).length > 0 ? { ...body, [EXTRA_PROPERTIES_KEY]: extras } : body;
    },
  };
}
