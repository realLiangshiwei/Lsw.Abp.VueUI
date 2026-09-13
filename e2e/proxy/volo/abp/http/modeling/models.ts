export interface ActionApiDescriptionModel {
  uniqueName?: string | undefined;
  name?: string | undefined;
  httpMethod?: string | null | undefined;
  url?: string | undefined;
  supportedVersions?: string[] | null | undefined;
  parametersOnMethod?: MethodParameterApiDescriptionModel[] | undefined;
  parameters?: ParameterApiDescriptionModel[] | undefined;
  returnValue?: ReturnValueApiDescriptionModel | undefined;
  allowAnonymous?: boolean | null | undefined;
  authorizeDatas?: AuthorizeDataApiDescriptionModel[] | undefined;
  implementFrom?: string | null | undefined;
  summary?: string | null | undefined;
  remarks?: string | null | undefined;
  description?: string | null | undefined;
  displayName?: string | null | undefined;
}

export interface ApplicationApiDescriptionModel {
  modules?: Record<string, ModuleApiDescriptionModel> | undefined;
  types?: Record<string, TypeApiDescriptionModel> | undefined;
}

export interface ApplicationApiDescriptionModelRequestDto {
  includeTypes?: boolean | undefined;
  includeDescriptions?: boolean | undefined;
}

export interface AuthorizeDataApiDescriptionModel {
  policy?: string | null | undefined;
  roles?: string | null | undefined;
}

export interface ControllerApiDescriptionModel {
  controllerName?: string | undefined;
  controllerGroupName?: string | null | undefined;
  isRemoteService?: boolean | undefined;
  isIntegrationService?: boolean | undefined;
  apiVersion?: string | null | undefined;
  type?: string | undefined;
  summary?: string | null | undefined;
  remarks?: string | null | undefined;
  description?: string | null | undefined;
  displayName?: string | null | undefined;
  interfaces?: ControllerInterfaceApiDescriptionModel[] | undefined;
  actions?: Record<string, ActionApiDescriptionModel> | undefined;
}

export interface ControllerInterfaceApiDescriptionModel {
  type?: string | undefined;
  name?: string | undefined;
  methods?: InterfaceMethodApiDescriptionModel[] | undefined;
}

export interface InterfaceMethodApiDescriptionModel {
  name?: string | undefined;
  parametersOnMethod?: MethodParameterApiDescriptionModel[] | undefined;
  returnValue?: ReturnValueApiDescriptionModel | undefined;
}

export interface MethodParameterApiDescriptionModel {
  name?: string | undefined;
  typeAsString?: string | undefined;
  type?: string | undefined;
  typeSimple?: string | undefined;
  isOptional?: boolean | undefined;
  defaultValue?: unknown | null | undefined;
  summary?: string | null | undefined;
  description?: string | null | undefined;
  displayName?: string | null | undefined;
}

export interface ModuleApiDescriptionModel {
  rootPath?: string | undefined;
  remoteServiceName?: string | undefined;
  controllers?: Record<string, ControllerApiDescriptionModel> | undefined;
}

export interface ParameterApiDescriptionModel {
  nameOnMethod?: string | undefined;
  name?: string | undefined;
  jsonName?: string | null | undefined;
  type?: string | null | undefined;
  typeSimple?: string | null | undefined;
  isOptional?: boolean | undefined;
  defaultValue?: unknown | null | undefined;
  constraintTypes?: string[] | null | undefined;
  bindingSourceId?: string | null | undefined;
  descriptorName?: string | null | undefined;
  summary?: string | null | undefined;
  description?: string | null | undefined;
  displayName?: string | null | undefined;
}

export interface PropertyApiDescriptionModel {
  name?: string | undefined;
  jsonName?: string | null | undefined;
  type?: string | undefined;
  typeSimple?: string | undefined;
  isRequired?: boolean | undefined;
  minLength?: number | null | undefined;
  maxLength?: number | null | undefined;
  minimum?: string | null | undefined;
  maximum?: string | null | undefined;
  regex?: string | null | undefined;
  isNullable?: boolean | undefined;
  summary?: string | null | undefined;
  description?: string | null | undefined;
  displayName?: string | null | undefined;
}

export interface ReturnValueApiDescriptionModel {
  type?: string | undefined;
  typeSimple?: string | undefined;
  summary?: string | null | undefined;
  contentTypes?: string[] | null | undefined;
  isRemoteStream?: boolean | undefined;
}

export interface TypeApiDescriptionModel {
  baseType?: string | null | undefined;
  isEnum?: boolean | undefined;
  enumNames?: string[] | null | undefined;
  enumValues?: unknown[] | null | undefined;
  genericArguments?: string[] | null | undefined;
  properties?: PropertyApiDescriptionModel[] | null | undefined;
  summary?: string | null | undefined;
  remarks?: string | null | undefined;
  description?: string | null | undefined;
  displayName?: string | null | undefined;
}
