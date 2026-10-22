import type { ApplicationConfigurationDto } from '@lsw-abpvue/core';

export type ApplicationConfiguration = Pick<
  ApplicationConfigurationDto,
  'objectExtensions' | 'localization'
>;

export type {
  ObjectExtensionsDto as ObjectExtensions,
  ModuleExtensionDto as ModuleExtension,
  EntityExtensionDto as EntityExtension,
  ExtensionPropertyDto as ExtensionProperty,
  ExtensionPropertyUiDto as ExtensionPropertyUi,
  ExtensionPropertyAttributeDto as ExtensionPropertyAttribute,
} from '@lsw-abpvue/core';
