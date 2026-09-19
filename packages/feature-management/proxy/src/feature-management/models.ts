import type { IStringValueType } from '../validation/string-values/models.js';

export interface FeatureDto {
  name?: string | undefined;
  displayName?: string | undefined;
  value?: string | undefined;
  provider?: FeatureProviderDto | undefined;
  description?: string | undefined;
  valueType?: IStringValueType | undefined;
  depth: number;
  parentName?: string | undefined;
}

export interface FeatureGroupDto {
  name?: string | undefined;
  displayName?: string | undefined;
  features?: FeatureDto[] | undefined;
}

export interface FeatureProviderDto {
  name?: string | undefined;
  key?: string | undefined;
}

export interface GetFeatureListResultDto {
  groups?: FeatureGroupDto[] | undefined;
}

export interface UpdateFeatureDto {
  name?: string | undefined;
  value?: string | undefined;
}

export interface UpdateFeaturesDto {
  features?: UpdateFeatureDto[] | undefined;
}
