import type { ExtensionPropertyAttributeDto, ExtensionPropertyDto } from '@lsw-abpvue/core';
import { Validators, type AbpValidator } from '@lsw-abpvue/theme-shared';

function numberOf(config: Record<string, unknown>, key: string): number | undefined {
  const value = config[key];
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * One of ABP's data annotation attributes as a validator. The names are the backend's:
 * `attribute.GetType().Name.ToCamelCase().RemovePostFix("Attribute")`, so `[StringLength]`
 * arrives as `stringLength`.
 */
function validatorsFor(attribute: ExtensionPropertyAttributeDto): AbpValidator[] {
  const config = attribute.config ?? {};

  switch (attribute.typeSimple) {
    case 'required':
      // An empty string satisfies the server, and the control starts at one, so a
      // required rule here would refuse a value the backend accepts.
      return config.allowEmptyStrings === true ? [] : [Validators.required()];

    case 'stringLength': {
      const maximum = numberOf(config, 'maximumLength');
      const minimum = numberOf(config, 'minimumLength');

      return [
        ...(maximum === undefined ? [] : [Validators.maxLength(maximum)]),
        ...(minimum ? [Validators.minLength(minimum)] : []),
      ];
    }

    case 'maxLength': {
      const length = numberOf(config, 'length');
      return length === undefined ? [] : [Validators.maxLength(length)];
    }

    case 'minLength': {
      const length = numberOf(config, 'length');
      return length ? [Validators.minLength(length)] : [];
    }

    case 'range': {
      const minimum = numberOf(config, 'minimum');
      const maximum = numberOf(config, 'maximum');
      // Exclusive bounds are .NET 8's addition to `[Range]` and have no validator of
      // their own here; the server still refuses the boundary value and the message
      // lands on the field.
      return minimum === undefined || maximum === undefined
        ? []
        : [Validators.range(minimum, maximum)];
    }

    case 'regularExpression': {
      const pattern = config.pattern;
      return typeof pattern === 'string' ? [Validators.pattern(new RegExp(pattern))] : [];
    }

    case 'emailAddress':
      return [Validators.email()];

    case 'url':
      return [Validators.url()];

    case 'compare': {
      const other = config.otherProperty;
      return typeof other === 'string' ? [Validators.compare(other)] : [];
    }

    default:
      return [];
  }
}

/**
 * The validators of one object extension property. Attributes with no client-side
 * meaning -- `[DataType]`, `[Display]` -- contribute nothing.
 * @param property The property as the backend describes it
 */
export function getValidatorsFromProperty(property: ExtensionPropertyDto): AbpValidator[] {
  return (property.attributes ?? []).flatMap(validatorsFor);
}
