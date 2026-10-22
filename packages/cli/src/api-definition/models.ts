import type {
  ActionApiDescriptionModel,
  AuthorizeDataApiDescriptionModel,
  ControllerApiDescriptionModel,
  MethodParameterApiDescriptionModel,
  ModuleApiDescriptionModel,
  ParameterApiDescriptionModel,
  PropertyApiDescriptionModel,
  ReturnValueApiDescriptionModel,
  TypeApiDescriptionModel,
} from '@lsw-abpvue/core';

type RequiredFields<T, K extends keyof T> = { [P in K]-?: NonNullable<T[P]> };

export interface ApiDefinition {
  modules: Record<string, ModuleDefinition>;
  types: Record<string, TypeDefinition>;
}

export type ModuleDefinition = RequiredFields<
  ModuleApiDescriptionModel,
  'rootPath' | 'remoteServiceName'
> & { controllers: Record<string, ControllerDefinition> };

export type ControllerDefinition = RequiredFields<
  ControllerApiDescriptionModel,
  'controllerName' | 'isRemoteService' | 'isIntegrationService' | 'type'
> &
  Pick<ControllerApiDescriptionModel, 'controllerGroupName'> & {
    actions: Record<string, ActionDefinition>;
  };

export type ActionDefinition = RequiredFields<
  ActionApiDescriptionModel,
  'uniqueName' | 'name' | 'httpMethod' | 'url'
> &
  Pick<ActionApiDescriptionModel, 'supportedVersions' | 'allowAnonymous'> & {
    parametersOnMethod: MethodParameter[];
    parameters: BoundParameter[];
    returnValue: ReturnValue;
    authorizeDatas?: AuthorizeData[] | null | undefined;
  };

export type AuthorizeData = AuthorizeDataApiDescriptionModel;

export type MethodParameter = RequiredFields<
  MethodParameterApiDescriptionModel,
  'name' | 'type' | 'typeSimple' | 'isOptional'
> &
  Pick<MethodParameterApiDescriptionModel, 'defaultValue'>;

export type BoundParameter = RequiredFields<
  ParameterApiDescriptionModel,
  'nameOnMethod' | 'name' | 'type' | 'typeSimple' | 'isOptional'
> &
  Pick<ParameterApiDescriptionModel, 'jsonName' | 'defaultValue' | 'descriptorName'> & {
    bindingSourceId: BindingSourceId;
  };

export type BindingSourceId =
  | 'Body'
  | 'Form'
  | 'FormFile'
  | 'ModelBinding'
  | 'Path'
  | 'Query'
  | 'Header'
  | 'Services'
  | 'Custom'
  | 'Special'
  | (string & {});

export type ReturnValue = RequiredFields<ReturnValueApiDescriptionModel, 'type' | 'typeSimple'> &
  Pick<ReturnValueApiDescriptionModel, 'contentTypes'> & {
    isRemoteStream?: ReturnValueApiDescriptionModel['isRemoteStream'] | null | undefined;
  };

export type TypeDefinition = Pick<
  TypeApiDescriptionModel,
  'baseType' | 'isEnum' | 'enumNames' | 'genericArguments'
> & {
  enumValues?: number[] | null | undefined;
  properties?: PropertyDefinition[] | null | undefined;
};

export type PropertyDefinition = RequiredFields<
  PropertyApiDescriptionModel,
  'name' | 'type' | 'typeSimple'
> &
  Omit<PropertyApiDescriptionModel, 'name' | 'type' | 'typeSimple'>;
