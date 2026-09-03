/** What `AbpFormField` hands to the control it wraps, so the wiring is not guesswork. */
export interface AbpFormFieldContext {
  /** The id the control must carry, so the label's `for` points at it. */
  id: string;
  /** Ids of the hint and the error messages, for the control's `aria-describedby`. */
  describedBy: string | undefined;
  invalid: boolean;
}

export interface AbpFormFieldProps {
  /** Already localized. */
  label?: string | undefined;
  /** The control's id. Generated when omitted, which is the usual case. */
  for?: string | undefined;
  required?: boolean | undefined;
  hint?: string | undefined;
  /** Localized messages; a non-empty list is what makes the field invalid. */
  errors?: readonly string[] | undefined;
  disabled?: boolean | undefined;
}

export interface AbpFormFieldSlots {
  default?: (context: AbpFormFieldContext) => unknown;
  label?: () => unknown;
  hint?: () => unknown;
  errors?: (context: { errors: readonly string[] }) => unknown;
}
