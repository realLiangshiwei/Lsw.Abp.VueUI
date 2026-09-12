/**
 * The half of `/api/abp/application-configuration` the generator reads. Object extension
 * properties are the only place the backend says what its validation rules are for a
 * property that is not part of any DTO, so the two endpoints together are what makes a
 * generated validator map worth having.
 */
export interface ApplicationConfiguration {
  objectExtensions?: ObjectExtensions | undefined;
}

export interface ObjectExtensions {
  modules: Record<string, ModuleExtension>;
  enums?: Record<string, unknown> | undefined;
}

export interface ModuleExtension {
  entities: Record<string, EntityExtension>;
}

export interface EntityExtension {
  properties: Record<string, ExtensionProperty>;
}

export interface ExtensionProperty {
  type?: string | undefined;
  typeSimple?: string | undefined;
  attributes?: ExtensionPropertyAttribute[] | undefined;
}

export interface ExtensionPropertyAttribute {
  /**
   * The attribute's name as ABP writes it: the class name in camel case with the
   * `Attribute` suffix removed, so `[StringLength]` arrives as `stringLength`.
   */
  typeSimple: string;
  config?: Record<string, unknown> | undefined;
}
