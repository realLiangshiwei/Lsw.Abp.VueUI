import { useLocalization } from '@lsw-abpvue/core';
import type { AbpValidationError } from '../models/validation.js';

/**
 * Turns a control's errors into the messages `AbpFormField` shows. Call it inside a
 * computed: the texts are reactive, so the messages follow a language change.
 */
export function useValidationMessages(): (errors: readonly AbpValidationError[]) => string[] {
  const localization = useLocalization();

  return errors => errors.map(error => localization.t(error.key, ...error.params));
}
