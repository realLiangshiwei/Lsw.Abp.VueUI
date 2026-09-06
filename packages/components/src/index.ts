export { EXTRA_PROPERTIES_KEY } from './constants/extra-properties.js';

export { PropType } from './enums/prop-type.js';

export {
  EntityAction,
  EntityActionList,
  ToolbarAction,
  ToolbarActionList,
} from './models/actions.js';
export type {
  ActionCallback,
  ActionContributorCallback,
  ActionOptions,
  ActionPredicate,
  Actions,
  EntityActionContributorCallback,
  EntityActionContributorCallbacks,
  EntityActionDefaults,
  EntityActionOptions,
  EntityActions,
  ToolbarActionContributorCallback,
  ToolbarActionContributorCallbacks,
  ToolbarActionDefaults,
  ToolbarActions,
} from './models/actions.js';
export { EntityProp, EntityPropList } from './models/entity-props.js';
export type {
  ColumnPredicate,
  EntityPropContributorCallback,
  EntityPropContributorCallbacks,
  EntityPropDefaults,
  EntityPropOptions,
  EntityProps,
  PropValue,
} from './models/entity-props.js';
export { FormProp, FormPropList, groupFormProps } from './models/form-props.js';
export type {
  FormPropContributorCallback,
  FormPropContributorCallbacks,
  FormPropDefaults,
  FormPropGroup,
  FormPropOptions,
  FormProps,
  GroupedFormProps,
} from './models/form-props.js';
export { unwrapResolvable } from './models/prop-data.js';
export type {
  GetInjected,
  PropData,
  PropTooltip,
  Resolvable,
  ToolbarData,
} from './models/prop-data.js';
export { Props } from './models/props.js';
export type {
  PropContributorCallback,
  PropContributorCallbacks,
  PropDisplayTextResolver,
  PropOptions,
  PropPredicate,
} from './models/props.js';

export { ExtensionsService, useExtensions } from './services/extensions.service.js';

export {
  ENTITY_PROP_TYPE_CLASSES,
  EXTENSIONS_ACTION_DATA,
  EXTENSIONS_FORM_PROP,
  EXTENSIONS_IDENTIFIER,
  ROW_INDEX,
  ROW_RECORD,
} from './tokens/extensions.token.js';

export { mergeWithDefaultActions, mergeWithDefaultProps } from './utils/merge.js';
export type { ActionsFactoryOf, PropsFactoryOf } from './utils/merge.js';
