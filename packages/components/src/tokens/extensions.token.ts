import { defineToken } from '@lsw-abpvue/core';
import type { Ref } from 'vue';
import type { PropType } from '../enums/prop-type.js';
import type { FormProp } from '../models/form-props.js';
import type { PropData } from '../models/prop-data.js';

/**
 * Which page the extensible table and form belong to, e.g. `Identity.UsersComponent`.
 * A page provides it for its own subtree:
 * `provideAbp([{ provide: EXTENSIONS_IDENTIFIER, useValue: IdentityComponents.Users }])`.
 */
export const EXTENSIONS_IDENTIFIER = defineToken<string>('EXTENSIONS_IDENTIFIER', {
  hint: 'A page renders an extensible table or form without saying which component key it is. Provide EXTENSIONS_IDENTIFIER in the page.',
});

/**
 * The row a custom cell component is rendering. Templates use the `#cell-{name}` slot
 * instead; this is for components a contributor supplies, which are not in the template.
 */
export const ROW_RECORD = defineToken<Ref<unknown>>('ROW_RECORD');

/** The position of {@link ROW_RECORD} in the page of records. */
export const ROW_INDEX = defineToken<Ref<number>>('ROW_INDEX');

/** The record and index a row or toolbar button was rendered for. */
export const EXTENSIONS_ACTION_DATA = defineToken<Ref<PropData<unknown>>>('EXTENSIONS_ACTION_DATA');

/** The field a custom form control is rendering. */
export const EXTENSIONS_FORM_PROP = defineToken<FormProp>('EXTENSIONS_FORM_PROP');

/** Extra classes per prop type, for a host that wants to style whole kinds of column. */
export const ENTITY_PROP_TYPE_CLASSES = defineToken<Partial<Record<PropType, string>>>(
  'ENTITY_PROP_TYPE_CLASSES',
  { factory: () => ({}) },
);
