import { inject } from '@lsw-abpvue/core';
import { LANGUAGE_MANAGEMENT_FEATURES } from '@lsw-abpvue/language-management/config';

export function languageManagementGuard(): boolean {
  return inject(LANGUAGE_MANAGEMENT_FEATURES).value.enable;
}
