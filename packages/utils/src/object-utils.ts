/** Every property optional, all the way down. Arrays and functions are kept whole. */
export type DeepPartial<T> = T extends readonly unknown[] | ((...args: never[]) => unknown)
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> | undefined }
    : T;

/**
 * Tells object literals apart from everything else an object type can be.
 *
 * Deliberately stricter than ABP's `isObjectAndNotArrayNotNode`: class instances, dates
 * and DOM nodes are not plain objects here, so they are replaced whole instead of being
 * walked into. The only thing merged deeply is configuration, which is JSON.
 *
 * @param value Value to test
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Merges two configuration objects, with the source winning wherever it is defined.
 *
 * Arrays are replaced rather than concatenated, and a `null` or `undefined` source keeps
 * the target value.
 *
 * @param target Object to merge into
 * @param source Object whose defined values take precedence
 */
export function deepMerge<T>(target: DeepPartial<T> | T, source: DeepPartial<T> | T): T {
  if (isPlainObject(target) && isPlainObject(source)) {
    const merged: Record<string, unknown> = {};

    for (const key of new Set([...Object.keys(target), ...Object.keys(source)])) {
      merged[key] = deepMerge(target[key], source[key]);
    }

    return merged as T;
  }

  if (source === undefined || source === null) {
    return (target === undefined || target === null ? {} : target) as T;
  }

  return source as T;
}
