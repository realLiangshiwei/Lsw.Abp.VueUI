import type { ApplicationLocalizationResourceDto } from '@lsw-abpvue/core';
import ordinary from './application-localization.en.json' with { type: 'json' };

export function ossLocalizationResources(): Record<string, ApplicationLocalizationResourceDto> {
  return structuredClone(ordinary.resources);
}
