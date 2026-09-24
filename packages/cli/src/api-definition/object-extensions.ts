/**
 * The half of `/api/abp/application-configuration` the generator reads. Object extension
 * properties are the only place the backend says what its validation rules are for a
 * property that is not part of any DTO, so the two endpoints together are what makes a
 * generated validator map worth having.
 */
export interface ApplicationConfiguration {
  objectExtensions?: ObjectExtensions | undefined;
  /**
   * The resource the application's own texts are in. A generated page localizes its
   * columns and its title out of it, the way the backend's own pages do.
   */
  localization?: { defaultResourceName?: string | null | undefined } | undefined;
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
  ui?: ExtensionPropertyUi | undefined;
}

/** Where the backend says a property should show, and what it should be looked up from. */
export interface ExtensionPropertyUi {
  onTable?: { isVisible?: boolean | undefined } | undefined;
  onCreateForm?: { isVisible?: boolean | undefined } | undefined;
  onEditForm?: { isVisible?: boolean | undefined } | undefined;
  lookup?: { url?: string | null | undefined } | undefined;
}

export interface ExtensionPropertyAttribute {
  /**
   * The attribute's name as ABP writes it: the class name in camel case with the
   * `Attribute` suffix removed, so `[StringLength]` arrives as `stringLength`.
   */
  typeSimple: string;
  config?: Record<string, unknown> | undefined;
}
