/**
 * What `/api/abp/api-definition?includeTypes=true` answers with. Only the parts the
 * generator reads are modelled; ABP sends more (summaries, display names) and anything
 * unmodelled is carried through untouched.
 */
export interface ApiDefinition {
  modules: Record<string, ModuleDefinition>;
  types: Record<string, TypeDefinition>;
}

export interface ModuleDefinition {
  rootPath: string;
  /** Becomes the `apiName` of every service generated from this module. */
  remoteServiceName: string;
  controllers: Record<string, ControllerDefinition>;
}

export interface ControllerDefinition {
  controllerName: string;
  controllerGroupName?: string | null;
  isRemoteService: boolean;
  isIntegrationService: boolean;
  /** The controller's CLR type, which is where its namespace comes from. */
  type: string;
  actions: Record<string, ActionDefinition>;
}

export interface ActionDefinition {
  uniqueName: string;
  name: string;
  httpMethod: string;
  /** `api/identity/users/{id}`, with no leading slash. */
  url: string;
  supportedVersions?: string[] | null;
  parametersOnMethod: MethodParameter[];
  parameters: BoundParameter[];
  returnValue: ReturnValue;
  allowAnonymous?: boolean | null;
  authorizeDatas?: AuthorizeData[] | null;
}

export interface AuthorizeData {
  policy?: string | null;
  roles?: string | null;
}

/** A parameter as it appears in the method signature. */
export interface MethodParameter {
  name: string;
  type: string;
  typeSimple: string;
  isOptional: boolean;
  defaultValue?: unknown;
}

/** A parameter as the request carries it, which is not one per method parameter. */
export interface BoundParameter {
  /** Which method parameter this came from; several may share one. */
  nameOnMethod: string;
  name: string;
  jsonName?: string | null;
  type: string;
  typeSimple: string;
  isOptional: boolean;
  defaultValue?: unknown;
  bindingSourceId: BindingSourceId;
  /** The method parameter to read the value off, empty when the parameter is the value. */
  descriptorName?: string | null;
}

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

export interface ReturnValue {
  type: string;
  typeSimple: string;
  contentTypes?: string[] | null;
  isRemoteStream?: boolean | null;
}

export interface TypeDefinition {
  baseType?: string | null;
  isEnum: boolean;
  enumNames?: string[] | null;
  enumValues?: number[] | null;
  /** The parameter names, while the key of the type itself carries `T0`, `T1`. */
  genericArguments?: string[] | null;
  properties?: PropertyDefinition[] | null;
}

export interface PropertyDefinition {
  name: string;
  jsonName?: string | null;
  type: string;
  typeSimple: string;
  isRequired: boolean;
  isNullable: boolean;
  /** From `[MinLength]`, or the minimum of `[StringLength]`. */
  minLength?: number | null;
  maxLength?: number | null;
  /** From `[Range]`, as text: the attribute takes any comparable. */
  minimum?: string | null;
  maximum?: string | null;
  /** From `[RegularExpression]`. */
  regex?: string | null;
}
