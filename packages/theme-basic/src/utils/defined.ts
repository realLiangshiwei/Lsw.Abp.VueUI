/** The same shape with every optional property allowed to be absent but never `undefined`. */
type Defined<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

/**
 * Drops the keys whose value is `undefined`. reka-ui declares its props as `?: T` rather
 * than `?: T | undefined`, and under `exactOptionalPropertyTypes` those are not the same
 * thing: an absent prop is fine, an explicit `undefined` is a type error. Passing the
 * result through `v-bind` is the one place that difference has to be dealt with.
 * @param props Props to forward, some of which may be undefined
 */
export function defined<T extends Record<string, unknown>>(props: T): Defined<T> {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as Defined<T>;
}
