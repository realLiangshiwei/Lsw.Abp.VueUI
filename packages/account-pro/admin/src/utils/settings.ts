export function applySettingChanges(fresh: unknown, before: unknown, edited: unknown): unknown {
  if (JSON.stringify(before) === JSON.stringify(edited)) return fresh;
  if (Array.isArray(edited) && Array.isArray(before) && Array.isArray(fresh)) {
    return fresh.map((item: unknown, index) => {
      const name = item && typeof item === 'object' && 'name' in item ? item.name : undefined;
      const previous = name === undefined ? index : before.findIndex(value => value?.name === name);
      const next = name === undefined ? index : edited.findIndex(value => value?.name === name);
      return previous < 0 || next < 0
        ? item
        : applySettingChanges(item, before[previous], edited[next]);
    });
  }
  if (
    edited &&
    before &&
    fresh &&
    typeof edited === 'object' &&
    typeof before === 'object' &&
    typeof fresh === 'object'
  ) {
    const result: Record<string, unknown> = { ...fresh };
    for (const key of Object.keys(edited)) {
      result[key] = applySettingChanges(
        Reflect.get(fresh, key),
        Reflect.get(before, key),
        Reflect.get(edited, key),
      );
    }
    return result;
  }
  return edited;
}
