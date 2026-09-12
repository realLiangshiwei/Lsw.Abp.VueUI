/**
 * A CLR type as `api-definition` writes it. ABP's own grammar: `[T]` is a collection,
 * `{K:V}` a dictionary, `T?` a nullable value type, and generics keep the angle
 * brackets. See `ApiTypeNameHelper.GetTypeName` on the server.
 */
export type ClrType =
  | { kind: 'name'; name: string; args: ClrType[] }
  | { kind: 'array'; item: ClrType }
  | { kind: 'dictionary'; key: ClrType; value: ClrType };

/** Splits on a separator that is not inside brackets of any kind. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index] as string;

    if (character === '<' || character === '[' || character === '{') depth += 1;
    else if (character === '>' || character === ']' || character === '}') depth -= 1;
    else if (character === separator && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(text.slice(start));

  return parts;
}

function isWrappedIn(text: string, open: string, close: string): boolean {
  if (!text.startsWith(open) || !text.endsWith(close)) return false;

  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === open) depth += 1;
    else if (character === close) {
      depth -= 1;
      // Closing the opening bracket before the end means the two are not a pair, as in
      // `[A],[B]`, which is two things rather than one wrapped thing.
      if (depth === 0 && index !== text.length - 1) return false;
    }
  }

  return depth === 0;
}

/**
 * Parses one type name. Nullability is dropped: a property says whether it is nullable
 * in a field of its own, and a parameter says whether it is optional.
 * @param text The type as the backend wrote it
 */
export function parseClrType(text: string): ClrType {
  let source = text.trim();
  while (source.endsWith('?')) source = source.slice(0, -1).trim();

  if (isWrappedIn(source, '[', ']')) {
    return { kind: 'array', item: parseClrType(source.slice(1, -1)) };
  }

  if (isWrappedIn(source, '{', '}')) {
    const [key = '', ...rest] = splitTopLevel(source.slice(1, -1), ':');
    return { kind: 'dictionary', key: parseClrType(key), value: parseClrType(rest.join(':')) };
  }

  // ABP writes a collection as `[T]`; a hand-edited definition might still say `T[]`.
  if (source.endsWith('[]')) {
    return { kind: 'array', item: parseClrType(source.slice(0, -2)) };
  }

  const open = source.indexOf('<');
  if (open > 0 && source.endsWith('>')) {
    const args = splitTopLevel(source.slice(open + 1, -1), ',')
      .map(argument => argument.trim())
      .filter(Boolean)
      .map(parseClrType);

    return { kind: 'name', name: source.slice(0, open).trim(), args };
  }

  return { kind: 'name', name: source, args: [] };
}

/**
 * The key this type has in the `types` pool. ABP writes an open generic there with
 * numbered placeholders, so `PagedResultDto<IdentityUserDto>` is looked up as
 * `PagedResultDto<T0>`.
 */
export function typePoolKey(type: ClrType): string {
  if (type.kind !== 'name') return '';
  if (type.args.length === 0) return type.name;

  return `${type.name}<${type.args.map((_, index) => `T${index}`).join(',')}>`;
}

/** Every named type in the tree, outermost first. */
export function namedTypes(type: ClrType): { kind: 'name'; name: string; args: ClrType[] }[] {
  switch (type.kind) {
    case 'name':
      return [type, ...type.args.flatMap(namedTypes)];
    case 'array':
      return namedTypes(type.item);
    case 'dictionary':
      return [...namedTypes(type.key), ...namedTypes(type.value)];
  }
}

/** The name without its namespace: `Volo.Abp.Identity.IdentityUserDto` is `IdentityUserDto`. */
export function shortName(name: string): string {
  return name.split('.').pop() ?? name;
}

/** Everything before the last segment, which is the directory the type is written to. */
export function namespaceOf(name: string): string {
  const segments = name.split('.');
  return segments.slice(0, -1).join('.');
}
