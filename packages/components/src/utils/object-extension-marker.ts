/**
 * The contributors the object extension mapping generated. Marking them is what lets a
 * report say "this column came from the backend" rather than lumping it in with the
 * application's own contributors; nothing else reads it.
 */
const generated = new WeakSet<object>();

export function markObjectExtensionContributor<T extends object>(contributor: T): T {
  generated.add(contributor);
  return contributor;
}

export function isObjectExtensionContributor(contributor: object): boolean {
  return generated.has(contributor);
}
