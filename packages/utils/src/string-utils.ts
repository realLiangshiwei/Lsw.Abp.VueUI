const PLACEHOLDER = /(['"])?\{\s*(\d+)\s*\}\1/g;

/**
 * Replaces the `{0}` `{1}` placeholders ABP's localization resources use.
 * A placeholder with no matching parameter is left in place.
 * @param text Text containing zero or more placeholders
 * @param params Values to substitute, indexed by the placeholder number
 */
export function interpolate(text: string, params: readonly unknown[]): string {
  return text.replace(PLACEHOLDER, (_match, quote: string | undefined, index: string) => {
    const value = params[Number(index)];
    const wrap = quote ?? '';
    const replacement = value === undefined || value === null ? `{${index}}` : String(value);

    return `${wrap}${replacement}${wrap}`;
  });
}
