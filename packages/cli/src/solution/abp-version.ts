import { parse, type ParseError } from 'jsonc-parser';

export function abpVersionIn(text: string): string | undefined {
  const errors: ParseError[] = [];
  // ABP's template can leave trailing commas in its solution metadata.
  const metadata = parse(text.replace(/^\uFEFF/, ''), errors, { allowTrailingComma: true }) as
    { versions?: { AbpFramework?: unknown } } | undefined;
  const version = metadata?.versions?.AbpFramework;

  return errors.length === 0 && typeof version === 'string' ? version : undefined;
}
