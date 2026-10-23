import type { PasswordRules } from './password-validators.js';

export class PasswordGenerationError extends Error {
  constructor() {
    super('AbpValidation::ThisFieldIsNotValid.');
    this.name = 'PasswordGenerationError';
  }
}

export function generatePassword(
  rules: PasswordRules,
  random: Pick<Crypto, 'getRandomValues'> = globalThis.crypto,
): string {
  const groups = [
    '0123456789',
    'abcdefghijklmnopqrstuvwxyz',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '!@#$%^&*()-_=+[]{}:,.?',
  ];
  const ascii = groups.join('');
  const alphabet = [
    ...ascii,
    ...(rules.requiredUniqueChars > ascii.length
      ? Array.from({ length: 128 }, (_, i) => String.fromCharCode(0x100 + i))
      : []),
  ];
  const length = Math.max(16, rules.requiredLength, rules.requiredUniqueChars);
  if (
    !random?.getRandomValues ||
    !Number.isInteger(length) ||
    length > 128 ||
    rules.requiredUniqueChars > alphabet.length
  )
    throw new PasswordGenerationError();
  function index(limit: number): number {
    const range = 0x1_0000_0000;
    const ceiling = range - (range % limit);
    const value = new Uint32Array(1);
    do {
      random.getRandomValues(value);
    } while ((value[0] ?? range) >= ceiling);
    return (value[0] ?? 0) % limit;
  }
  const required = [
    rules.requireDigit,
    rules.requireLowercase,
    rules.requireUppercase,
    rules.requireNonAlphanumeric,
  ];
  const characters = groups.flatMap((group, i) =>
    required[i] ? [group[index(group.length)] ?? ''] : [],
  );
  const remaining = alphabet.filter(character => !characters.includes(character));
  while (new Set(characters).size < rules.requiredUniqueChars) {
    const selected = remaining.splice(index(remaining.length), 1)[0];
    if (!selected) throw new PasswordGenerationError();
    characters.push(selected);
  }
  while (characters.length < length) characters.push(alphabet[index(alphabet.length)] ?? '');
  for (let i = characters.length - 1; i > 0; i -= 1) {
    const other = index(i + 1);
    const saved = characters[i] ?? '';
    characters[i] = characters[other] ?? '';
    characters[other] = saved;
  }
  return characters.join('');
}
