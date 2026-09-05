import { computed, ref, shallowRef, type Ref } from 'vue';
import type {
  AbpFormControl,
  AbpFormControls,
  AbpFormDefinition,
  AbpFormFieldDefinition,
  AbpFormGroup,
} from '../models/form.js';
import type { AbpValidationError, AbpValidatorContext } from '../models/validation.js';

/** `ExtraProperties.Title` and `userName` both reduce to what a control is named. */
function normalizeMember(member: string): string {
  return (member.split('.').at(-1) ?? member).toLowerCase();
}

function toServerError(message: string): AbpValidationError {
  return { rule: 'server', key: message, params: [] };
}

function createControl<T>(
  name: string,
  definition: AbpFormFieldDefinition<T>,
  context: AbpValidatorContext,
): AbpFormControl<T> {
  const validators = definition.validators ?? [];
  const raw = ref(definition.value) as Ref<T>;
  const dirty = ref(false);
  const touched = ref(false);
  const disabled = ref(definition.disabled ?? false);
  const readonlyState = ref(definition.readonly ?? false);
  const serverErrors = shallowRef<AbpValidationError[]>([]);
  let initial = definition.value;

  const errors = computed<AbpValidationError[]>(() => {
    const found: AbpValidationError[] = [];
    for (const validate of validators) {
      const error = validate(raw.value, context);
      if (error) found.push(error);
    }

    return [...found, ...serverErrors.value];
  });

  // Plain getters over refs rather than `reactive()`: reading one inside a computed or a
  // render tracks the ref just the same, and the type stays the interface above instead
  // of whatever `UnwrapNestedRefs` makes of it.
  return {
    name,

    get value() {
      return raw.value;
    },
    set value(next: T) {
      raw.value = next;
      dirty.value = true;
      // What the server rejected was the old value.
      serverErrors.value = [];
    },

    get errors() {
      return errors.value;
    },
    get valid() {
      return errors.value.length === 0;
    },
    get invalid() {
      return errors.value.length > 0;
    },
    get dirty() {
      return dirty.value;
    },
    get touched() {
      return touched.value;
    },
    get disabled() {
      return disabled.value;
    },
    set disabled(next: boolean) {
      disabled.value = next;
    },
    get readonly() {
      return readonlyState.value;
    },
    set readonly(next: boolean) {
      readonlyState.value = next;
    },

    markAsTouched: () => {
      touched.value = true;
    },
    markAsDirty: () => {
      dirty.value = true;
    },

    patch: (next: T) => {
      raw.value = next;
    },

    reset: (next?: T) => {
      if (next !== undefined) initial = next;
      raw.value = initial;
      dirty.value = false;
      touched.value = false;
      serverErrors.value = [];
    },

    setServerErrors: (messages: readonly string[]) => {
      serverErrors.value = messages.map(toServerError);
    },

    clearServerErrors: () => {
      serverErrors.value = [];
    },
  };
}

/**
 * Builds a form. Vue has no reactive forms of its own and the extensible form needs one,
 * because its fields come from contributors at runtime rather than from a template.
 * @param definition One entry per field: its initial value, its validators, its state
 */
export function useAbpForm<TValue extends Record<string, unknown>>(
  definition: AbpFormDefinition<TValue>,
): AbpFormGroup<TValue> {
  const controls = {} as { [K in keyof TValue]: AbpFormControl<TValue[K]> };
  const unmatched = shallowRef<string[]>([]);

  const context: AbpValidatorContext = {
    valueOf: name => controls[name as keyof TValue]?.value,
  };

  for (const name of Object.keys(definition) as (keyof TValue)[]) {
    controls[name] = createControl(String(name), definition[name], context);
  }

  const all = Object.values(controls) as AbpFormControl[];

  const value = computed(
    () =>
      Object.fromEntries(
        (Object.keys(controls) as (keyof TValue)[]).map(name => [name, controls[name].value]),
      ) as TValue,
  );

  const errors = computed(() => all.flatMap(control => control.errors));

  return {
    controls: controls as AbpFormControls<TValue>,

    get value() {
      return value.value;
    },
    get valid() {
      return errors.value.length === 0;
    },
    get invalid() {
      return errors.value.length > 0;
    },
    get dirty() {
      return all.some(control => control.dirty);
    },
    get touched() {
      return all.some(control => control.touched);
    },
    get errors() {
      return errors.value;
    },
    get unmatchedServerErrors() {
      return unmatched.value;
    },

    get: name => controls[name as keyof TValue] as AbpFormControl | undefined,

    validate: () => {
      for (const control of all) control.markAsTouched();
      return errors.value.length === 0;
    },

    patch: next => {
      for (const [name, fieldValue] of Object.entries(next)) {
        controls[name as keyof TValue]?.patch(fieldValue as TValue[keyof TValue]);
      }
    },

    reset: next => {
      for (const name of Object.keys(controls) as (keyof TValue)[]) {
        const control = controls[name];
        if (next && name in next) control.reset(next[name] as TValue[typeof name]);
        else control.reset();
      }
      unmatched.value = [];
    },

    markAllAsTouched: () => {
      for (const control of all) control.markAsTouched();
    },

    setServerErrors: serverErrors => {
      const byName = new Map(all.map(control => [normalizeMember(control.name), control]));
      const perControl = new Map<AbpFormControl, string[]>();
      const leftOver: string[] = [];

      for (const error of serverErrors ?? []) {
        const members = (error.members ?? []).filter(member => member.length > 0);
        const matched = members
          .map(member => byName.get(normalizeMember(member)))
          .filter((control): control is AbpFormControl => control !== undefined);

        if (matched.length === 0) {
          leftOver.push(error.message);
          continue;
        }

        for (const control of matched) {
          perControl.set(control, [...(perControl.get(control) ?? []), error.message]);
        }
      }

      for (const control of all) control.setServerErrors(perControl.get(control) ?? []);
      unmatched.value = leftOver;
    },

    clearServerErrors: () => {
      for (const control of all) control.clearServerErrors();
      unmatched.value = [];
    },
  };
}
