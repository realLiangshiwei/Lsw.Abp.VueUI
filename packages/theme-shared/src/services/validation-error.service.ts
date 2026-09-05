import { defineService, inject, type ServiceOf } from '@lsw-abpvue/core';
import { onScopeDispose } from 'vue';
import type { AbpServerValidationError } from '../models/validation.js';

/** What the validation handler needs from a form. Every `AbpFormGroup` has it. */
export interface ServerErrorTarget {
  setServerErrors(errors: readonly AbpServerValidationError[] | undefined): void;
}

/**
 * Which form a rejected request belongs to. Registration is a stack: the form of a
 * dialog opened over a page is registered last and is the one the user is looking at.
 */
export const ValidationErrorService = defineService('ValidationErrorService', () => {
  const targets: ServerErrorTarget[] = [];

  return {
    /**
     * @param target Receives the validation errors of a rejected request
     * @returns Stops receiving them
     */
    register: (target: ServerErrorTarget): (() => void) => {
      targets.push(target);

      return () => {
        const index = targets.lastIndexOf(target);
        if (index >= 0) targets.splice(index, 1);
      };
    },

    /** False when nothing is listening, which is what makes the chain carry on. */
    get hasTarget(): boolean {
      return targets.length > 0;
    },

    /**
     * @param errors ABP's `validationErrors`
     * @returns Whether a form took them
     */
    dispatch: (errors: readonly AbpServerValidationError[] | undefined): boolean => {
      const target = targets.at(-1);
      if (!target) return false;

      target.setServerErrors(errors);
      return true;
    },
  };
});
export type ValidationErrorService = ServiceOf<typeof ValidationErrorService>;

/**
 * Sends the validation errors of a rejected request to this form, for as long as the
 * component using it is alive.
 * @param form The form the errors belong to
 */
export function useServerValidation(form: ServerErrorTarget): void {
  const service = inject(ValidationErrorService);
  onScopeDispose(service.register(form), true);
}
