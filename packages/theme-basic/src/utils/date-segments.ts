interface SegmentValues {
  day?: number | undefined;
  month?: number | undefined;
  year?: number | undefined;
  hour?: number | undefined;
  minute?: number | undefined;
  second?: number | undefined;
}

/** Orders and formats a date field's accessible segments using ABP's culture pattern. */
export function orderedDateSegments<T extends { part: string; value: string }>(
  segments: T[],
  pattern?: string,
  dateSeparator?: string,
  locale = 'en',
  values?: SegmentValues,
): T[] {
  if (!pattern) return segments;
  const parts: Record<string, string> = {
    d: 'day',
    M: 'month',
    y: 'year',
    h: 'hour',
    H: 'hour',
    m: 'minute',
    s: 'second',
    t: 'dayPeriod',
  };
  const tokens =
    pattern.match(/'[^']*'|"[^"]*"|\\.|d+|M+|y+|h+|H+|m+|s+|t+|[^dMyhHmst'"\\]+/g) ?? [];
  const ordered: T[] = [];
  const used = new Set<string>();
  for (const token of tokens) {
    const part = parts[token[0] ?? ''];
    if (part) {
      const segment = segments.find(item => item.part === part);
      if (segment && !used.has(part)) {
        const number = values?.[part as keyof SegmentValues];
        let value = segment.value;
        if (number !== undefined) {
          if (part === 'month' && token.length >= 3) {
            value = new Intl.DateTimeFormat(locale, {
              month: token.length === 3 ? 'short' : 'long',
              timeZone: 'UTC',
              calendar: 'gregory',
            }).format(new Date(Date.UTC(2000, number - 1, 15)));
          } else {
            const shown =
              part === 'year' && token.length === 2
                ? number % 100
                : part === 'hour' && token[0] === 'h'
                  ? number % 12 || 12
                  : number;
            value = new Intl.NumberFormat(locale, {
              minimumIntegerDigits: Math.min(token.length, 4),
              useGrouping: false,
            }).format(shown);
          }
        }
        ordered.push({ ...segment, value });
        used.add(part);
      }
    } else {
      const value = token.replace(/^['"\\]|['"]$/g, '').replace(/\//g, dateSeparator ?? '/');
      ordered.push({ part: 'literal', value } as T);
    }
  }
  return segments.some(segment => segment.part !== 'literal' && !used.has(segment.part))
    ? segments
    : ordered;
}
