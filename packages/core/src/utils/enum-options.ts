/** One member of an enum, as a generated `*.enum.ts` file lists it for a select. */
export interface EnumOption<T> {
  /** The member name, which is also its localization key in the module's resource. */
  key: string;
  value: T;
}

/**
 * The members of an enum, in declaration order. A numeric enum also maps its values back
 * to their names, and those reverse entries are not members.
 * @param enumeration The enum object a generated proxy declared
 */
export function mapEnumToOptions<T extends Record<string, string | number>>(
  enumeration: T,
): EnumOption<T[keyof T]>[] {
  return Object.keys(enumeration)
    .filter(key => !/^\d+$/.test(key))
    .map(key => ({ key, value: enumeration[key] as T[keyof T] }));
}
