const RESERVED = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
]);

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Whether a name can be written bare, as a property or a variable. */
export function isIdentifier(name: string): boolean {
  return IDENTIFIER.test(name) && !RESERVED.has(name);
}

/** `'foo bar'`, or `foo` when it needs no quoting. */
export function quoteName(name: string): string {
  return isIdentifier(name) ? name : `'${name.replace(/'/g, "\\'")}'`;
}

function isUpper(character: string): boolean {
  return character !== character.toLowerCase();
}

/**
 * The casing ABP's own JSON serializer applies to a property name, acronyms included:
 * `IPAddress` becomes `ipAddress` and `ID` becomes `id`, which is what arrives on the
 * wire and therefore what the generated interface has to say.
 * @param text The CLR property name
 */
export function camelCase(text: string): string {
  if (!text || !isUpper(text[0] as string)) return text;

  const characters = [...text];

  for (let index = 0; index < characters.length; index += 1) {
    const next = characters[index + 1];
    // A second character that is already lower case means the first one was the only
    // capital, so `Name` stops here having become `name`.
    if (index === 1 && !isUpper(characters[index] as string)) break;
    if (index > 0 && next !== undefined && !isUpper(next)) break;

    characters[index] = (characters[index] as string).toLowerCase();
  }

  return characters.join('');
}

export function pascalCase(text: string): string {
  const words = text.split(/[^A-Za-z0-9]+/).filter(Boolean);

  return words.map(word => (word[0] as string).toUpperCase() + word.slice(1)).join('');
}

/** `IdentityUser` becomes `identity-user`, which is what the file is called. */
export function kebabCase(text: string): string {
  return text
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z\d])/g, '$1-$2')
    .replace(/[\s_.]+/g, '-')
    .toLowerCase();
}

/** `Volo.Abp.Identity` becomes `volo/abp/identity`, the directory it is written to. */
export function namespaceToDirectory(namespace: string): string {
  return namespace
    .split('.')
    .filter(Boolean)
    .map(segment => kebabCase(segment))
    .join('/');
}

/**
 * The path from one namespace's directory to another's, as an import specifier.
 * @param from The namespace importing
 * @param to The namespace imported from
 */
export function relativeNamespacePath(from: string, to: string): string {
  const fromParts = from ? from.split('.') : [];
  const toParts = to ? to.split('.') : [];

  let shared = 0;
  while (
    shared < fromParts.length &&
    shared < toParts.length &&
    fromParts[shared] === toParts[shared]
  ) {
    shared += 1;
  }

  const up = fromParts.slice(shared).map(() => '..');
  const down = toParts.slice(shared).map(segment => kebabCase(segment));
  const parts = [...up, ...down];

  if (parts.length === 0) return '.';
  return (up.length ? parts.join('/') : `./${parts.join('/')}`).replace(/\/+$/, '');
}
