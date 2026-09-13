export interface IStringValueType {
  name?: string | undefined;
  item?: unknown | null | undefined;
  properties?: Record<string, unknown> | undefined;
  validator?: IValueValidator | undefined;
}

export interface IValueValidator {
  name?: string | undefined;
  item?: unknown | null | undefined;
  properties?: Record<string, unknown> | undefined;
}
