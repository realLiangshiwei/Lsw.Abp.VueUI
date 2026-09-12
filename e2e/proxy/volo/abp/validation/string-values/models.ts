export interface IStringValueType {
  name?: string;
  item?: unknown | null;
  properties?: Record<string, unknown>;
  validator?: IValueValidator;
}

export interface IValueValidator {
  name?: string;
  item?: unknown | null;
  properties?: Record<string, unknown>;
}
