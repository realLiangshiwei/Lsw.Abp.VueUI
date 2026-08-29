/** A key, or a key with the text to fall back on when the backend has nothing. */
export type LocalizationParam = string | LocalizationWithDefault;

export interface LocalizationWithDefault {
  key: string;
  defaultValue: string;
}

/** Texts shipped with the application rather than fetched, per culture. */
export interface AbpLocalization {
  culture: string;
  resources: { resourceName: string; texts: Record<string, string> }[];
}
