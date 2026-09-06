import { defineService, inject, type ServiceOf } from '@lsw-abpvue/core';
import { EntityActionsFactory, ToolbarActionsFactory } from '../models/actions.js';
import { EntityPropsFactory } from '../models/entity-props.js';
import { FormPropsFactory } from '../models/form-props.js';

/**
 * The five extension points, one registry each. Everything a page can be extended with
 * -- its columns, its create and edit fields, its row buttons and its toolbar -- is a
 * contributor registered here under the page's component key.
 */
export const ExtensionsService = defineService('ExtensionsService', () => ({
  entityProps: new EntityPropsFactory(),
  createFormProps: new FormPropsFactory(),
  editFormProps: new FormPropsFactory(),
  entityActions: new EntityActionsFactory(),
  toolbarActions: new ToolbarActionsFactory(),
}));
export type ExtensionsService = ServiceOf<typeof ExtensionsService>;

export const useExtensions = (): ExtensionsService => inject(ExtensionsService);
